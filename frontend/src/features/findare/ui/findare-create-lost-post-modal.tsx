'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateLostPostMutation } from '../data-access/use-create-lost-post-mutation'
import { useGetConfigQuery } from '../data-access/use-get-config-query'
import { useInitializeAppMutation } from '../data-access/use-initialize-app-mutation'
import { toast } from 'sonner'

const LAMPORTS_PER_SOL = 1_000_000_000n
const MIN_REWARD_SOL = 0.1

export function FindareCreateLostPostModal({
  onClose,
}: {
  onClose: () => void
  config?: { data: { lostPostCount: bigint } }
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [attributes, setAttributes] = useState('')
  const [photoRef, setPhotoRef] = useState('')
  const [rewardSol, setRewardSol] = useState('')
  
  const configQuery = useGetConfigQuery()
  const createMutation = useCreateLostPostMutation()
  const initMutation = useInitializeAppMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const rewardAmount = parseFloat(rewardSol)
    if (isNaN(rewardAmount) || rewardAmount < MIN_REWARD_SOL) {
      toast.error(`Reward must be at least ${MIN_REWARD_SOL} SOL`)
      return
    }

    try {
      // Initialize app if needed
      if (!configQuery.data?.exists) {
        toast.info('Initializing app...')
        await initMutation.mutateAsync()
        // Refetch config
        await configQuery.refetch()
      }

      // Get post ID from config
      const postId = configQuery.data?.exists 
        ? Number(configQuery.data.data.lostPostCount)
        : 0
      
      const rewardLamports = BigInt(Math.floor(rewardAmount * Number(LAMPORTS_PER_SOL)))

      await createMutation.mutateAsync({
        postId,
        title,
        description,
        attributes,
        photoRef: photoRef || 'ipfs://placeholder',
        rewardLamports,
      })
      toast.success('Lost post created successfully!')
      onClose()
      setTitle('')
      setDescription('')
      setAttributes('')
      setPhotoRef('')
      setRewardSol('')
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to create lost post')
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Lost Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lost iPhone 15 Pro"
              required
              maxLength={64}
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item in detail..."
              required
              maxLength={512}
              className="w-full min-h-[100px] px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <Label htmlFor="attributes">Attributes *</Label>
            <Input
              id="attributes"
              value={attributes}
              onChange={(e) => setAttributes(e.target.value)}
              placeholder="e.g., Black, 256GB, with case"
              required
              maxLength={256}
            />
          </div>
          <div>
            <Label htmlFor="photoRef">Photo Reference (IPFS URI)</Label>
            <Input
              id="photoRef"
              value={photoRef}
              onChange={(e) => setPhotoRef(e.target.value)}
              placeholder="ipfs://..."
              maxLength={128}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Note: Photo is only visible to admins for verification
            </p>
          </div>
          <div>
            <Label htmlFor="reward">Reward (SOL) *</Label>
            <Input
              id="reward"
              type="number"
              step="0.1"
              min={MIN_REWARD_SOL}
              value={rewardSol}
              onChange={(e) => setRewardSol(e.target.value)}
              placeholder={`Minimum: ${MIN_REWARD_SOL} SOL`}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Minimum reward: {MIN_REWARD_SOL} SOL
            </p>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

