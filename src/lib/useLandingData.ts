import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLiveEvents } from './useLiveEvents';

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
  closedDays?: string;
  currencySymbol?: string;
  announcementText?: string;
  announcementActive?: boolean;
}

export interface LandingStats {
  totalBookings: number;
  totalClients: number;
  totalServices: number;
  satisfactionRate: number;
  clientInitials: string[];
}

const DEFAULT_SHOP: ShopSettings = {
  shopName: 'Aurelian Salon',
  shopTagline: 'Luxury Grooming & Styling',
  phone: '+1 (555) 234-5678',
  email: 'contact@aureliansalon.com',
  address: '123 Luxury Ave, Beverly Hills, CA',
  openingTime: '09:00',
  closingTime: '18:00',
  slotDurationMinutes: 30,
  minimumAdvanceMinutes: 60,
  maximumAdvanceDays: 30,
  autoConfirmBookings: true,
  allowCancellation: true,
  cancellationCutoffHours: 2,
  cancellationCutoffMinutes: 120,
  breakStartTime: '13:00',
  breakEndTime: '14:00',
  breakEnabled: false,
  closedDays: '0',
  currencySymbol: '$',
  announcementText: '',
  announcementActive: false,
};

const DEFAULT_STATS: LandingStats = {
  totalBookings: 0,
  totalClients: 0,
  totalServices: 0,
  satisfactionRate: 100,
  clientInitials: [],
};

export function useLandingData() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [shop, setShop] = useState<ShopSettings>(DEFAULT_SHOP);
  const [stats, setStats] = useState<LandingStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [servicesRes, shopRes, statsRes] = await Promise.allSettled([
        fetch('/api/services').then(r => (r.ok ? r.json() : [])),
        fetch('/api/shop').then(r => (r.ok ? r.json() : null)),
        fetch('/api/stats').then(r => (r.ok ? r.json() : null)),
      ]);

      if (servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value)) {
        setServices(servicesRes.value);
      }
      if (shopRes.status === 'fulfilled' && shopRes.value) {
        const shopData = shopRes.value;
        if (!shopData.currencySymbol || shopData.currencySymbol === '?') {
          shopData.currencySymbol = '$';
        }
        setShop(shopData);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      }
    } catch (err) {
      console.error('Failed to load live database landing data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadData]);

  // Real-Time Server-Sent Event Triggers (Zero DB polling overhead)
  useLiveEvents(useMemo(() => ({
    services_updated: () => loadData(),
    settings_updated: () => loadData(),
    availability_updated: () => loadData(),
    bookings_updated: () => loadData(),
  }), [loadData]));

  return { services, shop, stats, loading };
}
