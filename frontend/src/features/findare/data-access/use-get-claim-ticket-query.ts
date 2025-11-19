import { useQuery } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { 
  fetchMaybeClaimTicket,
} from '../../../../anchor/src/client/js/generated'
import { getProgramDerivedAddress, getBytesEncoder, getAddressEncoder } from 'gill'
import type { Address } from 'gill'
import { FINDARE_PROGRAM_ADDRESS } from '../../../../anchor/src/client/js/generated'

async function getClaimTicketAddress(foundPostAddress: Address, claimerAddress: Address) {
  const [address] = await getProgramDerivedAddress({
    programAddress: FINDARE_PROGRAM_ADDRESS,
    seeds: [
      getBytesEncoder().encode(new Uint8Array([99, 108, 97, 105, 109, 45, 116, 105, 99, 107, 101, 116])), // b"claim-ticket"
      getAddressEncoder().encode(foundPostAddress),
      getAddressEncoder().encode(claimerAddress),
    ],
  })
  return address
}

export function useGetClaimTicketQuery(
  foundPostAddress: Address | null,
  claimerAddress: Address | null,
  enabled: boolean = true
) {
  const { client } = useSolana()
  
  return useQuery({
    queryKey: ['findare', 'claim-ticket', foundPostAddress, claimerAddress],
    queryFn: async () => {
      if (!client || !foundPostAddress || !claimerAddress) return null
      const claimTicketAddress = await getClaimTicketAddress(foundPostAddress, claimerAddress)
      return fetchMaybeClaimTicket(client.rpc, claimTicketAddress)
    },
    enabled: enabled && !!client && !!foundPostAddress && !!claimerAddress,
  })
}

