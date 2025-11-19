'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useGetConfigQuery } from '../data-access/use-get-config-query'
import { useGetFoundListingsQuery } from '../data-access/use-get-found-listings-query'
import { FindareCreateFoundListingModal } from './findare-create-found-listing-modal'
import { FindareFoundListingCard } from './findare-found-listing-card'

export function FindareFoundFeed() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const configQuery = useGetConfigQuery()
  const foundListingsQuery = useGetFoundListingsQuery()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Found Items</h2>
        <Button onClick={() => setShowCreateModal(true)}>Report Found Item</Button>
      </div>

      {showCreateModal && (
        <FindareCreateFoundListingModal
          onClose={() => setShowCreateModal(false)}
          config={configQuery.data ?? undefined}
        />
      )}

      <div className="space-y-4">
        {foundListingsQuery.isLoading ? (
          <Card className="p-6">
            <p className="text-muted-foreground text-center py-8">Loading found listings...</p>
          </Card>
        ) : foundListingsQuery.data && foundListingsQuery.data.length > 0 ? (
          foundListingsQuery.data.map((listing) => (
            <FindareFoundListingCard key={listing.address} listing={listing} />
          ))
        ) : (
          <Card className="p-6">
            <p className="text-muted-foreground text-center py-8">
              No found items reported yet. Be the first to report a found item!
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
