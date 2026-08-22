import { useState, useEffect } from 'react';

export interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopSettings {
  shopName: string;
  shopTagline: string;
  phone: string;
  email: string;
  address: string;
  openingTime: string;
  closingTime: string;
  slotDurationMinutes: number;
  minimumAdvanceMinutes: number;
  maximumAdvanceDays: number;
  autoConfirmBookings: boolean;
  allowCancellation: boolean;
  cancellationCutoffHours: number;
  cancellationCutoffMinutes: number;
  breakStartTime?: string;
  breakEndTime?: string;
  breakEnabled?: boolean;
  closedDays: string;
  currencySymbol: string;
  announcementText: string;
  announcementActive: boolean;
}

export interface LandingStats {
  totalBookings: number;
  totalClients: number;
  totalServices: number;
  satisfactionRate: number;
}

const DEFAULT_SHOP: ShopSettings = {
  shopName: 'Aurelian Salon',
  shopTagline: 'Luxury Grooming & Bespoke Styling',
  phone: '+1 (555) 234-5678',
  email: 'concierge@aureliansalon.com',
  address: '14 Mayfair Atelier, London / DIFC Dubai / Beverly Hills',
  openingTime: '09:00',
  closingTime: '20:00',
  slotDurationMinutes: 30,
  minimumAdvanceMinutes: 60,
  maximumAdvanceDays: 30,
  autoConfirmBookings: true,
  allowCancellation: true,
  cancellationCutoffHours: 2,
  cancellationCutoffMinutes: 120,
  closedDays: '0',
  currencySymbol: '₹',
  announcementText: '',
  announcementActive: false,
};

const DEFAULT_STATS: LandingStats = {
  totalBookings: 2400,
  totalClients: 1850,
  totalServices: 8,
  satisfactionRate: 99,
};

export function useLandingData() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [shop, setShop] = useState<ShopSettings>(DEFAULT_SHOP);
  const [stats, setStats] = useState<LandingStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [servicesRes, shopRes, statsRes] = await Promise.allSettled([
          fetch('/api/services').then(r => (r.ok ? r.json() : [])),
          fetch('/api/shop').then(r => (r.ok ? r.json() : null)),
          fetch('/api/stats').then(r => (r.ok ? r.json() : null)),
        ]);

        if (!isMounted) return;

        if (servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value) && servicesRes.value.length > 0) {
          setServices(servicesRes.value);
        }
        if (shopRes.status === 'fulfilled' && shopRes.value) {
          setShop({ ...DEFAULT_SHOP, ...shopRes.value });
        }
        if (statsRes.status === 'fulfilled' && statsRes.value) {
          setStats(prev => ({
            ...prev,
            ...statsRes.value,
            totalBookings: statsRes.value.totalBookings > 0 ? statsRes.value.totalBookings : prev.totalBookings,
            totalClients: statsRes.value.totalClients > 0 ? statsRes.value.totalClients : prev.totalClients,
            totalServices: (servicesRes.status === 'fulfilled' && servicesRes.value?.length) || (statsRes.value.totalServices > 0 ? statsRes.value.totalServices : prev.totalServices),
          }));
        }
      } catch (err) {
        console.warn('Could not load live landing data, using defaults:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return { services, shop, stats, loading };
}
