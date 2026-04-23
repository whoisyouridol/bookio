import { createContext, useContext, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getSalonBySlug } from '@/api/salons';
import { getCurrentSubdomain } from '@/lib/subdomain';
import { Loader } from '@/components/ui/Loader';
import type { SalonDetailDto } from '@/types';

interface SalonSubdomainContextType {
  salon: SalonDetailDto;
  salonId: string;
  salonSlug: string;
}

export const SalonSubdomainContext = createContext<SalonSubdomainContextType | undefined>(undefined);

export function SalonSubdomainProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const slug = getCurrentSubdomain()!;

  const { data: salon, isLoading, error } = useQuery({
    queryKey: ['salon-subdomain', slug],
    queryFn: () => getSalonBySlug(slug),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('errors.salonSubdomain.notFound')}</h1>
          <p className="text-gray-500">{t('errors.salonSubdomain.notFoundDescription', { slug })}</p>
        </div>
      </div>
    );
  }

  return (
    <SalonSubdomainContext.Provider value={{ salon, salonId: salon.id, salonSlug: slug }}>
      {children}
    </SalonSubdomainContext.Provider>
  );
}

export function useSalonSubdomain() {
  const ctx = useContext(SalonSubdomainContext);
  if (!ctx) throw new Error('useSalonSubdomain must be used within SalonSubdomainProvider');
  return ctx;
}

export function useSalonSubdomainOptional() {
  return useContext(SalonSubdomainContext) ?? null;
}
