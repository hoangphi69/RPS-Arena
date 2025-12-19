'use client';

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { GGC_MODULE } from '../constants';

const GGC_COIN_TYPE = `${GGC_MODULE}::GGC`;
const MIST_PER_GGC = 1_000_000_000;

export const useGGCBalance = () => {
  const client = useSuiClient();
  const account = useCurrentAccount();

  const query = useQuery({
    // Unique Query Key for GGC
    queryKey: ['ggcBalance', account?.address],

    queryFn: async () => {
      if (!account?.address) {
        return '0';
      }

      // Fetch specific Coin Type
      const balanceResult = await client.getBalance({
        owner: account.address,
        coinType: GGC_COIN_TYPE,
      });

      const balanceInMist = BigInt(balanceResult.totalBalance);

      // Convert to human-readable format
      const balanceInGGC = (Number(balanceInMist) / MIST_PER_GGC).toFixed(2);

      return balanceInGGC;
    },
    enabled: !!account?.address,
    refetchInterval: 10000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
