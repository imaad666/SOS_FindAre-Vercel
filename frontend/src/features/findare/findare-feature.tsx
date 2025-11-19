'use client'
import { useState } from 'react'
import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { FindareLostFeed } from './ui/findare-lost-feed'
import { FindareFoundFeed } from './ui/findare-found-feed'

export default function FindareFeature() {
  const { account } = useSolana()
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost')

  if (!account) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Find[Are]</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Connect your wallet to start finding lost items or reporting found items
          </p>
          <WalletDropdown />
        </div>
      </div>
    )
  }

  // Don't block on initialization - show the app and let users create posts
  // Initialization will happen automatically when they try to create a post

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Find[Are]</h1>
        <p className="text-muted-foreground">
          Lost something? Found something? Let's help each other out.
        </p>
      </div>

      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('lost')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'lost'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Lost Items
          </button>
          <button
            onClick={() => setActiveTab('found')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'found'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Found Items
          </button>
        </nav>
      </div>

      {activeTab === 'lost' ? <FindareLostFeed /> : <FindareFoundFeed />}
    </div>
  )
}
