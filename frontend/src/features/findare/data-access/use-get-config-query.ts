import { useQuery } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { 
  fetchMaybeAppConfig, 
  FINDARE_PROGRAM_ADDRESS 
} from '../../../../anchor/src/client/js/generated'
import { getProgramDerivedAddress, getBytesEncoder } from 'gill'

async function getAppConfigAddress() {
  const encoder = getBytesEncoder()
  const configSeed = encoder.encode(new Uint8Array([99, 111, 110, 102, 105, 103])) // b"config"
  const [address] = await getProgramDerivedAddress({
    programAddress: FINDARE_PROGRAM_ADDRESS,
    seeds: [configSeed],
  })
  return address
}

export function useGetConfigQuery() {
  const { client, cluster } = useSolana()
  
  return useQuery({
    queryKey: ['findare', 'config', cluster?.label || 'default'],
    queryFn: async () => {
      if (!client) {
        return null
      }
      try {
        const configAddress = await getAppConfigAddress()
        const config = await fetchMaybeAppConfig(client.rpc, configAddress)
        return config?.exists ? config : null
      } catch {
        // Config doesn't exist - return null
        return null
      }
    },
    enabled: !!client,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  })
}

