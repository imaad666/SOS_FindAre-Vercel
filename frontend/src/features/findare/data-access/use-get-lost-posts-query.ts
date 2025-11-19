import { useQuery } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { 
  fetchMaybeLostPost,
  getLostPostDiscriminatorBytes,
  FINDARE_PROGRAM_ADDRESS 
} from '../../../../anchor/src/client/js/generated'
import type { Address } from 'gill'
export function useGetLostPostsQuery() {
  const { client, cluster } = useSolana()
  
  return useQuery({
    queryKey: ['findare', 'lost-posts', cluster.label],
    queryFn: async () => {
      if (!client) throw new Error('Client not available')
      const discriminator = getLostPostDiscriminatorBytes()
      const discriminatorBase64 = Buffer.from(discriminator).toString('base64')
      
      // Fetch all lost post accounts using discriminator filter
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

      const lostPosts = await Promise.all(
        accounts.value.map(async (account: { pubkey: Address }) => {
          try {
            const post = await fetchMaybeLostPost(client.rpc, account.pubkey as Address)
            return post?.exists ? post : null
          } catch {
            return null
          }
        })
      )

      return lostPosts.filter((post): post is NonNullable<typeof post> => post !== null)
    },
    enabled: !!client,
  })
}

