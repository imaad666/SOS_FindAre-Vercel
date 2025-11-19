'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useInitializeAppMutation } from '../data-access/use-initialize-app-mutation'
import { toast } from 'sonner'

export function FindareInitializeApp() {
  const initializeMutation = useInitializeAppMutation()

  const handleInitialize = async () => {
    try {
      await initializeMutation.mutateAsync()
      toast.success('App initialized successfully! You are now the admin.')
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to initialize app')
    }
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Initialize Find[Are]</h2>
        <p className="text-muted-foreground">
          The app needs to be initialized before you can create posts. This will set you as the admin.
        </p>
        <Button 
          onClick={handleInitialize} 
          disabled={initializeMutation.isPending}
          size="lg"
        >
          {initializeMutation.isPending ? 'Initializing...' : 'Initialize App'}
        </Button>
      </div>
    </Card>
  )
}

