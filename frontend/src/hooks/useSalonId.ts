import { useContext } from 'react';
import { useParams } from 'react-router';
import { SalonSubdomainContext } from '@/contexts/SalonSubdomainContext';

/**
 * Returns the current salonId from either URL params (main domain)
 * or SalonSubdomainContext (subdomain mode).
 */
export function useSalonId(): string {
  const params = useParams<{ salonId?: string }>();
  const subdomainCtx = useContext(SalonSubdomainContext);

  if (params.salonId) return params.salonId;
  if (subdomainCtx) return subdomainCtx.salonId;

  throw new Error('No salonId available from params or subdomain context');
}
