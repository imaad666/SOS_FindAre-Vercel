'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSolana } from '@/components/solana/use-solana'
import { useSubmitFoundReportMutation } from '../data-access/use-submit-found-report-mutation'
import { useGetConfigQuery } from '../data-access/use-get-config-query'
import { useApproveFoundReportMutation, useRejectFoundReportMutation } from '../data-access/use-admin-actions-mutation'
import { toast } from 'sonner'
import type { Account } from 'gill'
import type { LostPost } from '../../../../anchor/src/client/js/generated'

const LAMPORTS_PER_SOL = 1_000_000_000n

function getPostStatusLabel(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'Open',
    1: 'Awaiting Admin Review',
    2: 'Awaiting Pickup',
    3: 'Closed',
  }
  return statusMap[status] || 'Unknown'
}

export function FindareLostPostCard({ post }: { post: Account<LostPost> }) {
  const [showFoundItModal, setShowFoundItModal] = useState(false)
  const [evidenceUri, setEvidenceUri] = useState('')
  const { account } = useSolana()
  const configQuery = useGetConfigQuery()
  const submitReportMutation = useSubmitFoundReportMutation()
  const approveMutation = useApproveFoundReportMutation()
  const rejectMutation = useRejectFoundReportMutation()

  const isAdmin = configQuery.data?.exists && configQuery.data?.data?.admin === account?.address
  const isOwner = post.data.owner === account?.address
  const rewardSol = Number(post.data.rewardLamports) / Number(LAMPORTS_PER_SOL)
  const status = Number(post.data.status)

  const handleFoundIt = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await submitReportMutation.mutateAsync({
        lostPostAddress: post.address,
        evidenceUri: evidenceUri || 'ipfs://evidence',
      })
      toast.success('Found report submitted! Waiting for admin verification.')
      setShowFoundItModal(false)
      setEvidenceUri('')
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to submit found report')
    }
  }

  const handleApprove = async () => {
    if (!post.data.finder || post.data.finder === '11111111111111111111111111111111') {
      toast.error('No finder address available')
      return
    }
    try {
      await approveMutation.mutateAsync({
        lostPostAddress: post.address,
        finderAddress: post.data.finder,
      })
      toast.success('Found report approved! Reward transferred to finder.')
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to approve report')
    }
  }

  const handleReject = async () => {
    if (!post.data.finder || post.data.finder === '11111111111111111111111111111111') {
      toast.error('No finder address available')
      return
    }
    try {
      await rejectMutation.mutateAsync({
        lostPostAddress: post.address,
        finderAddress: post.data.finder,
      })
      toast.success('Found report rejected. Post reopened.')
    } catch (error: unknown) {
      toast.error((error as Error)?.message || 'Failed to reject report')
    }
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold">{post.data.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Posted by {post.data.owner.slice(0, 8)}...{post.data.owner.slice(-8)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{rewardSol.toFixed(2)} SOL</div>
              <div className="text-sm text-muted-foreground">Reward</div>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground">{post.data.description}</p>
          </div>

          <div>
            <p className="text-sm">
              <span className="font-semibold">Attributes:</span> {post.data.attributes}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                status === 0 ? 'bg-green-100 text-green-800' :
                status === 1 ? 'bg-yellow-100 text-yellow-800' :
                status === 2 ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {getPostStatusLabel(status)}
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
              {status === 0 && account && !isOwner && (
                <Button size="sm" onClick={() => setShowFoundItModal(true)}>
                  Found It!
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {showFoundItModal && (
        <Dialog open onOpenChange={() => setShowFoundItModal(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Found Report</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFoundIt} className="space-y-4">
              <div>
                <Label htmlFor="evidence">Evidence URI (IPFS)</Label>
                <Input
                  id="evidence"
                  value={evidenceUri}
                  onChange={(e) => setEvidenceUri(e.target.value)}
                  placeholder="ipfs://..."
                  maxLength={128}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowFoundItModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitReportMutation.isPending}>
                  {submitReportMutation.isPending ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
