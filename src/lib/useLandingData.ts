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
  clientInitials?: string[];
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
  closedDays: '0',
  currencySymbol: '$',
  announcementText: '',
  announcementActive: false,
};

const DEFAULT_STATS: LandingStats = {
  totalBookings: 0,
  totalClients: 0,
  totalServices: 0,
  satisfactionRate: 98,
  clientInitials: ['A', 'V', 'R', 'S'],
};

export const DEFAULT_SERVICES: ServiceItem[] = [
  { id: '1', name: 'Signature Bespoke Haircut & Consultation', durationMinutes: 45, price: 65, active: true },
  { id: '2', name: 'Artisanal Hot Towel Shave & Facial Ritual', durationMinutes: 45, price: 70, active: true },
  { id: '3', name: 'Master Beard Sculpting & Conditioning Oil', durationMinutes: 30, price: 45, active: true },
  { id: '4', name: 'The Aurelian Royal Executive Sanctuary Package', durationMinutes: 90, price: 150, active: true },
  { id: '5', name: 'Revitalizing Japanese Scalp Head Spa Treatment', durationMinutes: 30, price: 55, active: true },
  { id: '6', name: 'Precision Styling, Botanical Wash & Finish', durationMinutes: 30, price: 40, active: true },
];

export function useLandingData() {
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [shop, setShop] = useState<ShopSettings>(DEFAULT_SHOP);
  const [stats, setStats] = useState<LandingStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);

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
          const shopData = shopRes.value;
          if (!shopData.currencySymbol || shopData.currencySymbol === '?') {
            shopData.currencySymbol = '$';
          }
          setShop({ ...DEFAULT_SHOP, ...shopData });
        }
        if (statsRes.status === 'fulfilled' && statsRes.value) {
          setStats(prev => ({
            ...prev,
            ...statsRes.value,
            totalBookings: typeof statsRes.value.totalBookings === 'number' ? statsRes.value.totalBookings : prev.totalBookings,
            totalClients: typeof statsRes.value.totalClients === 'number' ? statsRes.value.totalClients : prev.totalClients,
            totalServices: (servicesRes.status === 'fulfilled' && servicesRes.value?.length) || (typeof statsRes.value.totalServices === 'number' ? statsRes.value.totalServices : prev.totalServices),
            satisfactionRate: typeof statsRes.value.satisfactionRate === 'number' ? statsRes.value.satisfactionRate : prev.satisfactionRate,
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
