import { pgTable, text, timestamp, boolean, uuid, integer, time, varchar, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  twoFactorEnabled: boolean("twoFactorEnabled"),
  role: text("role").$type<"USER" | "ADMIN">().default("USER").notNull()
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id)
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  issuer: text("issuer"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull()
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt")
});

// Better Auth Two Factor

export const twoFactor = pgTable("twoFactor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backupCodes").notNull(),
  userId: text("userId").notNull().references(() => user.id)
});

// Application specific tables

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // 'Haircut' or 'Shaving'
  durationMinutes: integer("durationMinutes").notNull(),
  price: integer("price").default(0),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull().references(() => user.id),
  serviceId: uuid("serviceId").notNull().references(() => services.id),
  bookingDate: varchar("bookingDate", { length: 10 }).notNull(), // YYYY-MM-DD
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM
  endTime: varchar("endTime", { length: 5 }).notNull(), // HH:MM
  status: text("status").$type<"PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED" | "EXPIRED">().default("ACCEPTED").notNull(),
  customerNote: text("customerNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  rejectedAt: timestamp("rejectedAt"),
  cancelledAt: timestamp("cancelledAt"),
  completedAt: timestamp("completedAt"),
}, (table) => [
  uniqueIndex("unique_active_booking_slot").on(table.bookingDate, table.startTime).where(sql`${table.status} IN ('ACCEPTED', 'PENDING')`)
]);

export const shopSettings = pgTable("shop_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopName: text("shopName").default("Aurelian Salon"),
  shopTagline: text("shopTagline").default("Luxury Grooming & Styling"),
  phone: text("phone").default("+1 (555) 234-5678"),
  email: text("email").default("contact@aureliansalon.com"),
  address: text("address").default("123 Luxury Ave, Beverly Hills, CA"),
  openingTime: varchar("openingTime", { length: 5 }).default("09:00").notNull(),
  closingTime: varchar("closingTime", { length: 5 }).default("19:00").notNull(),
  slotDurationMinutes: integer("slotDurationMinutes").default(30).notNull(),
  minimumAdvanceMinutes: integer("minimumAdvanceMinutes").default(60).notNull(),
  maximumAdvanceDays: integer("maximumAdvanceDays").default(30).notNull(),
  autoConfirmBookings: boolean("autoConfirmBookings").default(true).notNull(),
  allowCancellation: boolean("allowCancellation").default(true).notNull(),
  cancellationCutoffHours: integer("cancellationCutoffHours").default(2).notNull(),
  cancellationCutoffMinutes: integer("cancellationCutoffMinutes").default(120).notNull(),
  breakStartTime: varchar("breakStartTime", { length: 5 }).default("13:00"),
  breakEndTime: varchar("breakEndTime", { length: 5 }).default("14:00"),
  breakEnabled: boolean("breakEnabled").default(false).notNull(),
  closedDays: text("closedDays").default("0").notNull(), // Comma-separated day numbers: 0=Sun, 1=Mon, ..., 6=Sat
  currencySymbol: varchar("currencySymbol", { length: 5 }).default("$").notNull(),
  announcementText: text("announcementText").default(""),
  announcementActive: boolean("announcementActive").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const shopBreaks = pgTable("shop_breaks", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayOfWeek: integer("dayOfWeek").notNull(), // 0 = Sunday, 1 = Monday
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  active: boolean("active").default(true).notNull(),
});

export const shopHolidays = pgTable("shop_holidays", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").references(() => user.id),
  action: text("action").notNull(),
  resourceType: text("resourceType").notNull(),
  resourceId: text("resourceId"),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
