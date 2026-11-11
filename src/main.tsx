import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { deveTentarDeNovo } from './api/client'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'
import { CarrinhoProvider } from './carrinho/CarrinhoProvider'
import './index.css'

// Cache compartilhado de todas as chamadas à API feitas pelo TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // por 30s os dados são "frescos": voltar a uma página não chama a API de novo
      retry: deveTentarDeNovo,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider dentro do QueryClientProvider: ele usa o cache para guardar o usuário logado */}
      <AuthProvider>
        <CarrinhoProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CarrinhoProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
