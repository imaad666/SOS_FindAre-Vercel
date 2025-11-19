import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { 
  getCreateLostPostInstructionAsync,
  FINDARE_PROGRAM_ADDRESS 
} from '../../../../anchor/src/client/js/generated'
import { 
  createTransaction, 
  getProgramDerivedAddress, 
  getBytesEncoder,
  signAndSendTransactionMessageWithSigners,
  getBase58Decoder
} from 'gill'
import { useWalletUiSigner } from '@wallet-ui/react'

async function getAppConfigAddress() {
  return getProgramDerivedAddress({
    programAddress: FINDARE_PROGRAM_ADDRESS,
    seeds: [getBytesEncoder().encode(new Uint8Array([99, 111, 110, 102, 105, 103]))], // b"config"
  })
}

export function useCreateLostPostMutation() {
  const { client, account, cluster } = useSolana()
  const queryClient = useQueryClient()
  const signer = account ? useWalletUiSigner({ account }) : null

  return useMutation({
    mutationFn: async (args: {
      postId: number
      title: string
      description: string
      attributes: string
      photoRef: string
      rewardLamports: bigint
    }) => {
      if (!client || !account || !signer) throw new Error('Client, account, or signer not available')
      
      const configAddress = await getAppConfigAddress()
      const instruction = await getCreateLostPostInstructionAsync({
        poster: account,
        config: configAddress,
        ...args,
      })

      const { value: latestBlockhash } = await client.rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()
      
      const transaction = createTransaction({
        feePayer: signer,
        version: 0,
        latestBlockhash,
        instructions: [instruction],
      })

      const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction)
      const signature = getBase58Decoder().decode(signatureBytes)
      return signature
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findare', 'lost-posts', cluster?.label] })
      queryClient.invalidateQueries({ queryKey: ['findare', 'config', cluster?.label] })
    },
  })
}

