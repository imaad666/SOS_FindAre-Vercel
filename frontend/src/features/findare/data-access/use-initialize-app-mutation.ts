import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSolana } from '@/components/solana/use-solana'
import { 
  getInitializeAppInstructionAsync,
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

export function useInitializeAppMutation() {
  const { client, account, cluster } = useSolana()
  const queryClient = useQueryClient()
  const signer = useWalletUiSigner({ account: account ?? { address: '' as any, label: '' } })

  return useMutation({
    mutationFn: async () => {
      if (!client || !account || !signer) throw new Error('Client, account, or signer not available')
      
      const configAddress = await getAppConfigAddress()
      const instruction = await getInitializeAppInstructionAsync({
        payer: account,
        admin: account.address,
        config: configAddress,
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
      queryClient.invalidateQueries({ queryKey: ['findare', 'config', cluster?.label] })
    },
  })
}

