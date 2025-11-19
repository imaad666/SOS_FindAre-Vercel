'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateFoundListingMutation } from '../data-access/use-create-found-listing-mutation'
import { useGetConfigQuery } from '../data-access/use-get-config-query'
import { useInitializeAppMutation } from '../data-access/use-initialize-app-mutation'
import { toast } from 'sonner'

export function FindareCreateFoundListingModal({
  onClose,
}: {
  onClose: () => void
  config?: { data: { foundPostCount: bigint } }
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [attributes, setAttributes] = useState('')
  const [photoRef, setPhotoRef] = useState('')
  
  const configQuery = useGetConfigQuery()
  const createMutation = useCreateFoundListingMutation()
  const initMutation = useInitializeAppMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
        ? Number(configQuery.data.data.foundPostCount)
        : 0

      await createMutation.mutateAsync({
        postId,
        title,
        description,
        attributes,
        photoRef: photoRef || 'ipfs://placeholder',
      })
      toast.success('Found listing created successfully!')
      onClose()
      setTitle('')
      setDescription('')
      setAttributes('')
      setPhotoRef('')
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to create found listing')
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Found Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Found iPhone 15 Pro"
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
              placeholder="Describe the item you found..."
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
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Listing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

