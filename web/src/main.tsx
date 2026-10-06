import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </NuqsAdapter>
  </StrictMode>,
)
