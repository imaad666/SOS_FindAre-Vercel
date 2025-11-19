'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSolana } from '@/components/solana/use-solana'
import { useClaimFoundListingMutation } from '../data-access/use-claim-found-listing-mutation'
import { useGetConfigQuery } from '../data-access/use-get-config-query'
import { useApproveClaimMutation, useRejectClaimMutation } from '../data-access/use-admin-actions-mutation'
import { toast } from 'sonner'
import type { Account, Address } from 'gill'
import type { FoundPost } from '../../../../anchor/src/client/js/generated'

const MIN_CLAIM_DEPOSIT_SOL = 0.01

function getClaimStatusLabel(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'Open',
    1: 'Awaiting Admin Review',
    2: 'Claimed',
  }
  return statusMap[status] || 'Unknown'
}

export function FindareFoundListingCard({ listing }: { listing: Account<FoundPost> }) {
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimNotes, setClaimNotes] = useState('')
  const [claimDeposit, setClaimDeposit] = useState('')
  const { account, client } = useSolana()
  const configQuery = useGetConfigQuery()
  const claimMutation = useClaimFoundListingMutation()
  const approveMutation = useApproveClaimMutation()
  const rejectMutation = useRejectClaimMutation()

  const isAdmin = configQuery.data?.exists && configQuery.data?.data?.admin === account?.address
  const isFinder = listing.data.finder === account?.address
  const status = Number(listing.data.status)

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    const deposit = parseFloat(claimDeposit)
    if (isNaN(deposit) || deposit < MIN_CLAIM_DEPOSIT_SOL) {
      toast.error(`Deposit must be at least ${MIN_CLAIM_DEPOSIT_SOL} SOL`)
      return
    }
    try {
      await claimMutation.mutateAsync({
        foundPostAddress: listing.address,
        claimNotes: claimNotes || 'Claiming this item',
        claimDepositSol: deposit,
      })
      toast.success('Claim submitted! Waiting for admin verification.')
      setShowClaimModal(false)
      setClaimNotes('')
      setClaimDeposit('')
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to submit claim')
    }
  }

  const handleApprove = async () => {
    if (!listing.data.activeClaim || listing.data.activeClaim === '11111111111111111111111111111111') {
      toast.error('No active claim found')
      return
    }
    // Fetch claim ticket to get claimer address
    try {
      const { fetchMaybeClaimTicket } = await import('../../../../anchor/src/client/js/generated')
      const claimTicket = await fetchMaybeClaimTicket(client!.rpc, listing.data.activeClaim as Address)
      if (!claimTicket?.exists) {
        toast.error('Claim ticket not found')
        return
      }
      await approveMutation.mutateAsync({
        foundPostAddress: listing.address,
        claimerAddress: claimTicket.data.claimer,
        finderAddress: listing.data.finder,
      })
      toast.success('Claim approved! Deposit transferred to finder.')
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to approve claim')
    }
  }

  const handleReject = async () => {
    if (!listing.data.activeClaim || listing.data.activeClaim === '11111111111111111111111111111111') {
      toast.error('No active claim found')
      return
    }
    // Fetch claim ticket to get claimer address
    try {
      const { fetchMaybeClaimTicket } = await import('../../../../anchor/src/client/js/generated')
      const claimTicket = await fetchMaybeClaimTicket(client!.rpc, listing.data.activeClaim as Address)
      if (!claimTicket?.exists) {
        toast.error('Claim ticket not found')
        return
      }
      await rejectMutation.mutateAsync({
        foundPostAddress: listing.address,
        claimerAddress: claimTicket.data.claimer,
      })
      toast.success('Claim rejected. Deposit refunded to claimant.')
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to reject claim')
    }
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold">{listing.data.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Found by {listing.data.finder.slice(0, 8)}...{listing.data.finder.slice(-8)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground">{listing.data.description}</p>
          </div>

          <div>
            <p className="text-sm">
              <span className="font-semibold">Attributes:</span> {listing.data.attributes}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                status === 0 ? 'bg-green-100 text-green-800' :
                status === 1 ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getClaimStatusLabel(status)}
              </span>
            </div>

            <div className="flex gap-2">
              {isAdmin && status === 1 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReject}
                    disabled={rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? 'Approving...' : 'Approve'}
                  </Button>
                </>
              )}
              {status === 0 && account && !isFinder && (
                <Button size="sm" onClick={() => setShowClaimModal(true)}>
                  Claim This Item
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {showClaimModal && (
        <Dialog open onOpenChange={() => setShowClaimModal(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Claim Found Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleClaim} className="space-y-4">
              <div>
                <Label htmlFor="notes">Claim Notes *</Label>
                <textarea
                  id="notes"
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="Describe why this item belongs to you..."
                  required
                  maxLength={512}
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="deposit">Deposit (SOL) *</Label>
                <Input
                  id="deposit"
                  type="number"
                  step="0.01"
                  min={MIN_CLAIM_DEPOSIT_SOL}
                  value={claimDeposit}
                  onChange={(e) => setClaimDeposit(e.target.value)}
                  placeholder={`Minimum: ${MIN_CLAIM_DEPOSIT_SOL} SOL`}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Minimum deposit: {MIN_CLAIM_DEPOSIT_SOL} SOL
                </p>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowClaimModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={claimMutation.isPending}>
                  {claimMutation.isPending ? 'Submitting...' : 'Submit Claim'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

