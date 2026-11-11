import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import './index.css'

// Cache compartilhado de todas as chamadas à API feitas pelo TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // por 30s os dados são "frescos": voltar a uma página não chama a API de novo
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
