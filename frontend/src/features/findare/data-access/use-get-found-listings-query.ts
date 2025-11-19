import { useQuery } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { 
  fetchMaybeFoundPost,
  getFoundPostDiscriminatorBytes,
  FINDARE_PROGRAM_ADDRESS 
} from '../../../../anchor/src/client/js/generated'
import type { Address } from 'gill'

export function useGetFoundListingsQuery() {
  const { client, cluster } = useSolana()
  
  return useQuery({
    queryKey: ['findare', 'found-listings', cluster.label],
    queryFn: async () => {
      if (!client) throw new Error('Client not available')
      const discriminator = getFoundPostDiscriminatorBytes()
      const discriminatorBase64 = Buffer.from(discriminator).toString('base64')
      
      // Fetch all found post accounts using discriminator filter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accounts = await (client.rpc.getProgramAccounts as any)(FINDARE_PROGRAM_ADDRESS, {
        filters: [
          {
            memcmp: {
              offset: 0n,
              bytes: discriminatorBase64,
            },
          },
        ],
        encoding: 'base64',
      }).send()

      const foundPosts = await Promise.all(
        accounts.value.map(async (account: { pubkey: Address }) => {
          try {
            const post = await fetchMaybeFoundPost(client.rpc, account.pubkey as Address)
            return post?.exists ? post : null
          } catch {
            return null
          }
        })
      )

      return foundPosts.filter((post): post is NonNullable<typeof post> => post !== null)
    },
    enabled: !!client,
  })
}

