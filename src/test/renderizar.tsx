import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from '../auth/AuthProvider'

/**
 * Renderiza um componente com os mesmos "provedores" do app (Query + Auth + Router).
 * Cada teste ganha um QueryClient novo para o cache de um teste não vazar no outro.
 */
export function renderizarComProvedores(ui: ReactElement, { rota = '/' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }, // em teste, erro deve aparecer na hora
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[rota]}>{ui}</MemoryRouter>
      </AuthProvider>
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

type RespostaFalsa = [status: number, body?: unknown]

/**
 * fetch falso que responde conforme "MÉTODO /caminho" (sem a query string).
 * Ex.: rotasFalsas({ 'POST /auth/login': [200, { token: 'abc' }] })
 * Rotas não mapeadas respondem 404, como a API faria.
 */
export function rotasFalsas(rotas: Record<string, RespostaFalsa>): typeof fetch {
  return (url, init) => {
    const caminho = new URL(String(url)).pathname
    const chave = `${init?.method ?? 'GET'} ${caminho}`
    const [status, body] = rotas[chave] ?? [
      404,
      { status: 404, mensagem: `Rota falsa não mapeada: ${chave}`, detalhes: [] },
    ]
    return Promise.resolve(
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      }),
    )
  }
}
