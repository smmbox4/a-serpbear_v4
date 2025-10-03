import { useMemo } from 'react';
import { useQuery } from 'react-query';
import type { BrandingConfig } from '../utils/branding';
import { DEFAULT_BRANDING } from '../utils/branding';

export const BRANDING_QUERY_KEY = ['branding-config'] as const;

export const fetchBrandingConfig = async (): Promise<BrandingConfig> => {
   const response = await fetch('/api/branding/config', {
      headers: {
         Accept: 'application/json',
      },
   });

   if (!response.ok) {
      throw new Error(`Failed to load branding config: ${response.status}`);
   }

   return response.json() as Promise<BrandingConfig>;
};

const isClient = typeof window !== 'undefined';

export const useBranding = () => {
   const queryResult = useQuery(BRANDING_QUERY_KEY, fetchBrandingConfig, {
      enabled: isClient,
      staleTime: Infinity,
      cacheTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      suspense: false,
      placeholderData: DEFAULT_BRANDING,
   });

   const brandingState = useMemo(() => ({
      branding: queryResult.data ?? DEFAULT_BRANDING,
      isLoading: queryResult.isLoading && queryResult.isFetching,
      isFetching: queryResult.isFetching,
      isError: queryResult.isError,
      refetch: queryResult.refetch,
   }), [queryResult.data, queryResult.isError, queryResult.isFetching, queryResult.isLoading, queryResult.refetch]);

   return brandingState;
};

export type UseBrandingReturn = ReturnType<typeof useBranding>;
