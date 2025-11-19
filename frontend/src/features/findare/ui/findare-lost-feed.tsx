'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useGetConfigQuery } from '../data-access/use-get-config-query'
import { useGetLostPostsQuery } from '../data-access/use-get-lost-posts-query'
import { FindareCreateLostPostModal } from './findare-create-lost-post-modal'
import { FindareLostPostCard } from './findare-lost-post-card'

export function FindareLostFeed() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const configQuery = useGetConfigQuery()
  const lostPostsQuery = useGetLostPostsQuery()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Lost Items</h2>
        <Button onClick={() => setShowCreateModal(true)}>Report Lost Item</Button>
      </div>

      {showCreateModal && (
        <FindareCreateLostPostModal
          onClose={() => setShowCreateModal(false)}
          config={configQuery.data ?? undefined}
        />
      )}

      <div className="space-y-4">
        {lostPostsQuery.isLoading ? (
          <Card className="p-6">
            <p className="text-muted-foreground text-center py-8">Loading lost posts...</p>
          </Card>
        ) : lostPostsQuery.data && lostPostsQuery.data.length > 0 ? (
          lostPostsQuery.data.map((post) => (
            <FindareLostPostCard key={post.address} post={post} />
          ))
        ) : (
          <Card className="p-6">
            <p className="text-muted-foreground text-center py-8">
              No lost items reported yet. Be the first to report a lost item!
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
