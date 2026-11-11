import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

/**
 * Renderiza um componente com os mesmos "provedores" do app (Query + Router).
 * Cada teste ganha um QueryClient novo para o cache de um teste não vazar no outro.
 */
export function renderizarComProvedores(ui: ReactElement, { rota = '/' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }, // em teste, erro deve aparecer na hora
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[rota]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

/** fetch falso que responde sempre o mesmo JSON. */
export function fetchRespondendo(body: unknown, status = 200): typeof fetch {
  // Tipar como typeof fetch faz o vi.fn() saber os parâmetros (url, init) em mock.calls
  return () =>
    Promise.resolve(
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
    )
}
