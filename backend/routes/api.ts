import express from "express";
import { auth } from "../auth.js";
import { db } from "../db/index.js";
import { services, bookings, shopSettings, user, shopBreaks, shopHolidays, session, account, twoFactor, auditLogs } from "../db/schema.js";
import { eq, and, desc, gte, lte, sql, count } from "drizzle-orm";
import redisClient from "../redis.js";
import { z } from "zod";
import { format, addMinutes, subMinutes, parse, isBefore, isAfter, startOfDay, addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";

export const apiRouter = express.Router();

// Middleware: Require Auth
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const session = await auth.api.getSession({ headers: req.headers as any });
    if (!session?.user) return res.status(401).json({ error: "Unauthorized" });
    (req as any).user = session.user;
    next();
};

const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const session = await auth.api.getSession({ headers: req.headers as any });
    if (!session?.user || session.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    (req as any).user = session.user;
    next();
};

// Rate limiting middleware
const rateLimit = (prefix: string, limit: number, windowSec: number) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `ratelimit:${prefix}:${ip}`;
    const count = await redisClient.incr(key);
    if (count === 1) await redisClient.expire(key, windowSec);
    if (count > limit) return res.status(429).json({ error: "Too many requests" });
    next();
};

// --- PUBLIC ROUTES ---
apiRouter.get("/services", rateLimit("services", 300, 60), async (req, res) => {
    const cacheKey = "cache:active_services";
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const data = await db.select().from(services).where(eq(services.active, true));
    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 300 });
    res.json(data);
});

apiRouter.get("/shop", rateLimit("shop", 300, 60), async (req, res) => {
    const cacheKey = "cache:shop_settings";
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const data = await db.select().from(shopSettings).limit(1);
    const shop = data[0] || { 
        shopName: "Aurelian Salon",
        shopTagline: "Luxury Grooming & Styling",
        phone: "+1 (555) 234-5678",
        email: "contact@aureliansalon.com",
        address: "123 Luxury Ave, Beverly Hills, CA",
        openingTime: "09:00", 
        closingTime: "19:00", 
        slotDurationMinutes: 30, 
        minimumAdvanceMinutes: 60, 
        maximumAdvanceDays: 30,
        autoConfirmBookings: true,
        allowCancellation: true,
        cancellationCutoffHours: 2,
        cancellationCutoffMinutes: 120,
        breakStartTime: "13:00",
        breakEndTime: "14:00",
        breakEnabled: false,
        closedDays: "0",
        currencySymbol: "$",
        announcementText: "",
        announcementActive: false
    };
    await redisClient.set(cacheKey, JSON.stringify(shop), { EX: 300 });
    res.json(shop);
});

apiRouter.get("/availability", rateLimit("avail", 300, 60), async (req, res) => {
    const { date, service } = req.query as { date: string, service: string };
    if (!date || !service) return res.status(400).json({ error: "Date and service required" });

    const cacheKey = `availability:${date}:${service}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    // Calculate availability
    const svc = await db.select().from(services).where(eq(services.name, service)).limit(1);
    if (!svc.length) return res.status(400).json({ error: "Service not found" });

    let settings = await db.select().from(shopSettings).limit(1);
    const shop = settings[0] || { 
        openingTime: "09:00", 
        closingTime: "19:00", 
        slotDurationMinutes: 30, 
        minimumAdvanceMinutes: 60, 
        maximumAdvanceDays: 30,
        breakStartTime: "13:00",
        breakEndTime: "14:00",
        breakEnabled: false,
        closedDays: "0"
    };

    // Check holidays
    const holidays = await db.select().from(shopHolidays).where(eq(shopHolidays.date, date));
    if (holidays.length > 0) {
        await redisClient.set(cacheKey, JSON.stringify([]), { EX: 60 });
        return res.json([]);
    }

    const dayOfWeek = parse(date, "yyyy-MM-dd", new Date()).getDay();

    // Check closed days (e.g., Sunday = 0)
    const closedDaysList = (shop.closedDays || "").split(',').map((d: string) => parseInt(d.trim())).filter((n: number) => !isNaN(n));
    if (closedDaysList.includes(dayOfWeek)) {
        await redisClient.set(cacheKey, JSON.stringify([]), { EX: 60 });
        return res.json([]);
    }

    const breaks = await db.select().from(shopBreaks).where(and(eq(shopBreaks.dayOfWeek, dayOfWeek), eq(shopBreaks.active, true)));

    const booked = await db.select().from(bookings).where(and(eq(bookings.bookingDate, date), eq(bookings.status, "ACCEPTED")));
    const pending = await db.select().from(bookings).where(and(eq(bookings.bookingDate, date), eq(bookings.status, "PENDING")));
    const allOccupied = [...booked, ...pending];

    let current = parse(`${date} ${shop.openingTime}`, "yyyy-MM-dd HH:mm", new Date());
    const closing = parse(`${date} ${shop.closingTime}`, "yyyy-MM-dd HH:mm", new Date());
    const slots = [];

    const now = new Date();
    const minAdvance = addMinutes(now, shop.minimumAdvanceMinutes);

    while (isBefore(addMinutes(current, svc[0].durationMinutes), closing) || current.getTime() === closing.getTime() - svc[0].durationMinutes * 60000) {
        const timeStr = format(current, "HH:mm");
        const slotEnd = addMinutes(current, svc[0].durationMinutes);

        // Check past / minimum advance
        if (isBefore(current, minAdvance)) {
            current = addMinutes(current, shop.slotDurationMinutes);
            continue;
        }

        // Check shop breaks
        let inBreak = false;
        if (shop.breakEnabled && shop.breakStartTime && shop.breakEndTime) {
            const bStart = parse(`${date} ${shop.breakStartTime}`, "yyyy-MM-dd HH:mm", new Date());
            const bEnd = parse(`${date} ${shop.breakEndTime}`, "yyyy-MM-dd HH:mm", new Date());
            if ((current >= bStart && current < bEnd) || (slotEnd > bStart && slotEnd <= bEnd) || (current <= bStart && slotEnd >= bEnd)) {
                inBreak = true;
            }
        }

        for (const b of breaks) {
            const bStart = parse(`${date} ${b.startTime}`, "yyyy-MM-dd HH:mm", new Date());
            const bEnd = parse(`${date} ${b.endTime}`, "yyyy-MM-dd HH:mm", new Date());
            if ((current >= bStart && current < bEnd) || (slotEnd > bStart && slotEnd <= bEnd)) {
                inBreak = true; break;
            }
        }

        // Check existing bookings
        let isOccupied = false;
        for (const b of allOccupied) {
            const bStart = parse(`${date} ${b.startTime}`, "yyyy-MM-dd HH:mm", new Date());
            const bEnd = parse(`${date} ${b.endTime}`, "yyyy-MM-dd HH:mm", new Date());
            if ((current >= bStart && current < bEnd) || (slotEnd > bStart && slotEnd <= bEnd) || (current <= bStart && slotEnd >= bEnd)) {
                isOccupied = true; break;
            }
        }

        if (!inBreak && !isOccupied) {
            slots.push(timeStr);
        }
        current = addMinutes(current, shop.slotDurationMinutes);
    }

    await redisClient.set(cacheKey, JSON.stringify(slots), { EX: 15 });
    res.json(slots);
});

// --- CUSTOMER ROUTES ---
apiRouter.post("/bookings", rateLimit("create_booking", 10, 60), requireAuth, async (req, res) => {
    const schema = z.object({ serviceId: z.string(), date: z.string(), time: z.string(), note: z.string().optional() });
    const parseRes = schema.safeParse(req.body);
    if (!parseRes.success) return res.status(400).json({ error: "Invalid data" });

    const { serviceId, date, time, note } = parseRes.data;
    const u = (req as any).user;

    const lockKey = `lock:booking:${date}:${time}`;
    const lock = await redisClient.set(lockKey, "LOCKED", { NX: true, EX: 5 });
    if (!lock) {
        return res.status(409).json({ error: "This slot is currently being processed. Please try again in a moment." });
    }

    try {
        const result = await db.transaction(async (tx) => {
            // 1. PostgreSQL transaction-level advisory lock to serialize concurrent requests on the same slot
            await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`slot:${date}:${time}`}))`);

            // 2. Fetch service details
            const svc = await tx.select().from(services).where(and(eq(services.id, serviceId), eq(services.active, true))).limit(1);
            if (!svc.length) throw new Error("Service not found or inactive");

            const newStart = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
            const newEnd = addMinutes(newStart, svc[0].durationMinutes);
            const endTime = format(newEnd, "HH:mm");

            // 3. Check shop settings
            const settings = await tx.select().from(shopSettings).limit(1);
            const shop = settings[0] || { openingTime: "09:00", closingTime: "18:00", slotDurationMinutes: 30, minimumAdvanceMinutes: 60, maximumAdvanceDays: 30 };

            const shopOpen = parse(`${date} ${shop.openingTime}`, "yyyy-MM-dd HH:mm", new Date());
            const shopClose = parse(`${date} ${shop.closingTime}`, "yyyy-MM-dd HH:mm", new Date());

            if (isBefore(newStart, shopOpen) || isBefore(shopClose, newEnd)) {
                throw new Error("Selected time is outside shop operating hours");
            }

            // Check minimum advance
            const now = new Date();
            const minAdvance = addMinutes(now, shop.minimumAdvanceMinutes);
            if (isBefore(newStart, minAdvance)) {
                throw new Error(`Bookings require at least ${shop.minimumAdvanceMinutes} minutes advance notice`);
            }

            // 4. Check holidays
            const holidays = await tx.select().from(shopHolidays).where(eq(shopHolidays.date, date));
            if (holidays.length > 0) {
                throw new Error("The salon is closed on this date");
            }

            // 5. Check shop breaks
            const dayOfWeek = parse(date, "yyyy-MM-dd", new Date()).getDay();
            const breaks = await tx.select().from(shopBreaks).where(and(eq(shopBreaks.dayOfWeek, dayOfWeek), eq(shopBreaks.active, true)));
            for (const b of breaks) {
                const bStart = parse(`${date} ${b.startTime}`, "yyyy-MM-dd HH:mm", new Date());
                const bEnd = parse(`${date} ${b.endTime}`, "yyyy-MM-dd HH:mm", new Date());
                if ((newStart >= bStart && newStart < bEnd) || (newEnd > bStart && newEnd <= bEnd) || (newStart <= bStart && newEnd >= bEnd)) {
                    throw new Error("Selected time coincides with a shop break");
                }
            }

            // 6. Concurrency Check: Check for ANY overlapping bookings (ACCEPTED or PENDING)
            const activeBookings = await tx.select().from(bookings).where(
                and(
                    eq(bookings.bookingDate, date),
                    sql`${bookings.status} IN ('ACCEPTED', 'PENDING')`
                )
            );

            for (const b of activeBookings) {
                const bStart = parse(`${date} ${b.startTime}`, "yyyy-MM-dd HH:mm", new Date());
                const bEnd = parse(`${date} ${b.endTime}`, "yyyy-MM-dd HH:mm", new Date());

                // Overlap condition: (StartA < EndB) and (EndA > StartB)
                if (newStart < bEnd && newEnd > bStart) {
                    throw new Error("This slot has just been booked by another user. Please select another time.");
                }
            }

            // 7. Instant Booking: insert with status ACCEPTED immediately (no admin confirmation required)
            const created = await tx.insert(bookings).values({
                userId: u.id,
                serviceId: svc[0].id,
                bookingDate: date,
                startTime: time,
                endTime,
                customerNote: note,
                status: "ACCEPTED",
                acceptedAt: new Date()
            }).returning();

            return { booking: created[0], serviceName: svc[0].name };
        });

        // 8. Invalidate availability cache immediately for this date
        await redisClient.del(`availability:${date}:${result.serviceName}`);
        await redisClient.del(`availability:${date}`);

        res.status(201).json(result.booking);
    } catch (err: any) {
        if (err?.code === '23505' || err?.message?.includes('unique_active_booking_slot') || err?.message?.includes('duplicate key')) {
            return res.status(409).json({ error: "This slot was just confirmed by another user. Please choose another available time." });
        }
        res.status(400).json({ error: err.message || "Booking failed" });
    } finally {
        await redisClient.del(lockKey);
    }
});

apiRouter.get("/bookings", requireAuth, async (req, res) => {
    const u = (req as any).user;
    const b = await db.select().from(bookings).where(eq(bookings.userId, u.id)).orderBy(desc(bookings.bookingDate), desc(bookings.startTime));
    res.json(b);
});

apiRouter.delete("/bookings/:id", requireAuth, async (req, res) => {
    const u = (req as any).user;
    const bookingId = req.params.id as string;
    const b = await db.select().from(bookings).where(and(eq(bookings.id, bookingId), eq(bookings.userId, u.id))).limit(1);
    if (!b.length) return res.status(404).json({ error: "Not found" });
    if (b[0].status === "COMPLETED" || b[0].status === "CANCELLED" || b[0].status === "REJECTED") {
        return res.status(400).json({ error: "Cannot cancel this booking" });
    }

    // Check cancellation policy from shop settings
    const settings = await db.select().from(shopSettings).limit(1);
    const shop = settings[0];
    if (shop) {
        if (shop.allowCancellation === false) {
            return res.status(400).json({ error: "Online cancellation is disabled. Please contact the salon directly." });
        }
        const cutoffMinutes = shop.cancellationCutoffMinutes !== undefined && shop.cancellationCutoffMinutes !== null
            ? shop.cancellationCutoffMinutes
            : (shop.cancellationCutoffHours !== undefined ? shop.cancellationCutoffHours * 60 : 120);

        if (cutoffMinutes > 0) {
            const bookingStart = parse(`${b[0].bookingDate} ${b[0].startTime}`, "yyyy-MM-dd HH:mm", new Date());
            const cutoffTime = subMinutes(bookingStart, cutoffMinutes);
            if (isAfter(new Date(), cutoffTime)) {
                const displayTime = cutoffMinutes >= 60 && cutoffMinutes % 60 === 0
                    ? `${cutoffMinutes / 60} hour(s)`
                    : `${cutoffMinutes} minute(s)`;
                return res.status(400).json({ error: `Cancellations must be made at least ${displayTime} before appointment time.` });
            }
        }
    }

    await db.update(bookings).set({ status: "CANCELLED", cancelledAt: new Date() }).where(eq(bookings.id, b[0].id));

    const svc = await db.select().from(services).where(eq(services.id, b[0].serviceId)).limit(1);
    if (svc.length) await redisClient.del(`availability:${b[0].bookingDate}:${svc[0].name}`);

    res.json({ success: true });
});

// --- ADMIN ROUTES ---
apiRouter.get("/admin/bookings", requireAdmin, async (req, res) => {
    const b = await db.select().from(bookings).orderBy(desc(bookings.bookingDate), desc(bookings.startTime));
    res.json(b);
});

apiRouter.get("/admin/customers", requireAdmin, async (req, res) => {
    const customers = await db.select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
    }).from(user).orderBy(desc(user.createdAt));

    // Get booking counts per user
    const bookingCounts = await db.select({
        userId: bookings.userId,
        count: count()
    }).from(bookings).groupBy(bookings.userId);

    const countMap: Record<string, number> = {};
    bookingCounts.forEach(bc => { countMap[bc.userId] = bc.count; });

    const result = customers.map(c => ({ ...c, bookingCount: countMap[c.id] || 0 }));
    res.json(result);
});

apiRouter.delete("/admin/customers/:id", requireAdmin, async (req, res) => {
    const targetId = req.params.id as string;
    if ((req as any).user.id === targetId) {
        return res.status(400).json({ error: "Cannot delete your own admin account." });
    }

    try {
        // Manually cascade delete dependent records to satisfy foreign keys
        await db.delete(bookings).where(eq(bookings.userId, targetId));
        await db.delete(session).where(eq(session.userId, targetId));
        await db.delete(account).where(eq(account.userId, targetId));
        await db.delete(twoFactor).where(eq(twoFactor.userId, targetId));
        await db.delete(auditLogs).where(eq(auditLogs.userId, targetId));

        // Delete the user record
        await db.delete(user).where(eq(user.id, targetId));

        res.json({ success: true });
    } catch (error: any) {
        console.error("Deletion error:", error);
        res.status(500).json({ error: "Failed to delete customer." });
    }
});

// Admin: Update customer (modify name, email, role)
apiRouter.patch("/admin/customers/:id", requireAdmin, async (req, res) => {
    const targetId = req.params.id as string;
    const schema = z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        role: z.enum(["USER", "ADMIN"]).optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid customer data" });

    try {
        const updated = await db.update(user).set({
            ...parsed.data,
            updatedAt: new Date()
        }).where(eq(user.id, targetId)).returning();

        if (!updated.length) return res.status(404).json({ error: "Customer not found" });
        res.json(updated[0]);
    } catch (err: any) {
        console.error("Update customer error:", err);
        res.status(500).json({ error: "Failed to update customer" });
    }
});

apiRouter.post("/admin/bookings/:id/:action", requireAdmin, async (req, res) => {
    const { id, action } = req.params as { id: string, action: string };
    const validActions: Record<string, "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED"> = {
        accept: "ACCEPTED", reject: "REJECTED", cancel: "CANCELLED", complete: "COMPLETED"
    };
    if (!validActions[action]) return res.status(400).json({ error: "Invalid action" });

    const b = await db.update(bookings).set({
        status: validActions[action],
        updatedAt: new Date(),
        ...(action === 'accept' ? { acceptedAt: new Date() } : {}),
        ...(action === 'reject' ? { rejectedAt: new Date() } : {}),
        ...(action === 'cancel' ? { cancelledAt: new Date() } : {}),
        ...(action === 'complete' ? { completedAt: new Date() } : {})
    }).where(eq(bookings.id, id)).returning();

    if (b.length) {
        const svc = await db.select().from(services).where(eq(services.id, b[0].serviceId)).limit(1);
        if (svc.length) await redisClient.del(`availability:${b[0].bookingDate}:${svc[0].name}`);
    }
    res.json(b[0]);
});

apiRouter.post("/admin/services", requireAdmin, async (req, res) => {
    const schema = z.object({ 
        name: z.string().min(1), 
        durationMinutes: z.number().min(1),
        price: z.number().min(0).optional().default(0)
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: "Invalid service data" });
    const svc = await db.insert(services).values(p.data).returning();
    await redisClient.del("cache:active_services");
    res.json(svc[0]);
});

apiRouter.patch("/admin/settings", requireAdmin, async (req, res) => {
    const schema = z.object({
        shopName: z.string().optional(),
        shopTagline: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        openingTime: z.string().optional(),
        closingTime: z.string().optional(),
        slotDurationMinutes: z.number().optional(),
        minimumAdvanceMinutes: z.number().optional(),
        maximumAdvanceDays: z.number().optional(),
        autoConfirmBookings: z.boolean().optional(),
        allowCancellation: z.boolean().optional(),
        cancellationCutoffHours: z.number().optional(),
        cancellationCutoffMinutes: z.number().optional(),
        breakStartTime: z.string().optional(),
        breakEndTime: z.string().optional(),
        breakEnabled: z.boolean().optional(),
        closedDays: z.string().optional(),
        currencySymbol: z.string().optional(),
        announcementText: z.string().optional(),
        announcementActive: z.boolean().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid settings data", details: parsed.error.issues });

    const settings = await db.select().from(shopSettings).limit(1);
    let result;
    if (settings.length) {
        const s = await db.update(shopSettings).set({ ...parsed.data, updatedAt: new Date() }).where(eq(shopSettings.id, settings[0].id)).returning();
        result = s[0];
    } else {
        const s = await db.insert(shopSettings).values(parsed.data as any).returning();
        result = s[0];
    }
    await redisClient.del("cache:shop_settings");
    res.json(result);
});

// Admin: Get ALL services (including inactive)
apiRouter.get("/admin/services", requireAdmin, async (req, res) => {
    const data = await db.select().from(services).orderBy(desc(services.createdAt));
    res.json(data);
});

// Admin: Update a service
apiRouter.patch("/admin/services/:id", requireAdmin, async (req, res) => {
    const serviceId = req.params.id as string;
    const schema = z.object({
        name: z.string().min(1).optional(),
        durationMinutes: z.number().min(1).optional(),
        price: z.number().min(0).optional(),
        active: z.boolean().optional()
    });
    const p = schema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: "Invalid data" });

    const svc = await db.update(services).set({
        ...p.data,
        updatedAt: new Date()
    }).where(eq(services.id, serviceId)).returning();

    if (!svc.length) return res.status(404).json({ error: "Service not found" });
    await redisClient.del("cache:active_services");
    res.json(svc[0]);
});

// Admin: Delete a service
apiRouter.delete("/admin/services/:id", requireAdmin, async (req, res) => {
    const serviceId = req.params.id as string;
    try {
        const svc = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
        if (!svc.length) return res.status(404).json({ error: "Service not found" });

        // Delete any associated bookings first to prevent FK constraint issues
        await db.delete(bookings).where(eq(bookings.serviceId, serviceId));
        await db.delete(services).where(eq(services.id, serviceId));
        await redisClient.del("cache:active_services");

        res.json({ success: true, message: "Service deleted successfully" });
    } catch (e: any) {
        res.status(500).json({ error: e.message || "Failed to delete service" });
    }
});

// Admin: Toggle customer role
apiRouter.patch("/admin/customers/:id/role", requireAdmin, async (req, res) => {
    const targetId = req.params.id as string;
    const adminUser = (req as any).user;

    if (adminUser.id === targetId) {
        return res.status(400).json({ error: "Cannot change your own role." });
    }

    const target = await db.select().from(user).where(eq(user.id, targetId)).limit(1);
    if (!target.length) return res.status(404).json({ error: "User not found" });

    const newRole = target[0].role === "ADMIN" ? "USER" : "ADMIN";
    const updated = await db.update(user).set({ role: newRole, updatedAt: new Date() }).where(eq(user.id, targetId)).returning();
    res.json(updated[0]);
});
