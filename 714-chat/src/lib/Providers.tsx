'use client'

import React from 'react'
import {
  WagmiProvider,
  createConfig,
  http
} from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

const config = getDefaultConfig({
  appName: '714 Chat',
  projectId: '714-app',
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
})

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
