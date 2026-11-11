import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { Pagina, Pedido } from '../api/types'
import { comTokenSalvo, maria, pedido } from '../test/dados'
import { renderizarComProvedores, rotasFalsas } from '../test/renderizar'
import { MeusPedidos } from './MeusPedidos'

function pagina(pedidos: Pedido[], totalPages = 1): Pagina<Pedido> {
  return { content: pedidos, page: { size: 10, number: 0, totalElements: pedidos.length, totalPages } }
}

function renderizar(rota = '/pedidos') {
  return renderizarComProvedores(
    <Routes>
      <Route path="/pedidos" element={<MeusPedidos />} />
    </Routes>,
    { rota },
  )
}

describe('MeusPedidos', () => {
  it('lista os pedidos com número, status, total e link para o detalhe', async () => {
    comTokenSalvo()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        rotasFalsas({
          'GET /auth/me': [200, maria],
          'GET /pedidos': [200, pagina([pedido({ id: 5 }), pedido({ id: 4, statusPedido: 'ENTREGUE' })])],
        }),
      ),
    )

    renderizar()

    const linha = await screen.findByRole('link', { name: /Pedido #5/ })
    expect(linha).toHaveAttribute('href', '/pedidos/5')
    expect(within(linha).getByText('Pendente')).toBeInTheDocument()
    expect(within(linha).getByText(/R\$\s449,80/)).toBeInTheDocument()
    expect(linha).toHaveTextContent('3 itens') // 2 teclados + 1 mouse
    expect(screen.getByRole('link', { name: /Pedido #4/ })).toHaveTextContent('Entregue')
  })

  it('mostra aviso quando ainda não há pedidos', async () => {
    comTokenSalvo()
    vi.stubGlobal(
      'fetch',
      vi.fn(rotasFalsas({ 'GET /auth/me': [200, maria], 'GET /pedidos': [200, pagina([])] })),
    )

    renderizar()

    expect(await screen.findByText('Você ainda não fez nenhum pedido')).toBeInTheDocument()
  })

  it('filtra por status pela URL', async () => {
    comTokenSalvo()
    const fetchFalso = vi.fn(
      rotasFalsas({ 'GET /auth/me': [200, maria], 'GET /pedidos': [200, pagina([pedido()])] }),
    )
    vi.stubGlobal('fetch', fetchFalso)
    renderizar()
    await screen.findByRole('link', { name: /Pedido #5/ })

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'PAGO')

    await vi.waitFor(() =>
      expect(fetchFalso).toHaveBeenLastCalledWith(
        'http://localhost:8080/pedidos?status=PAGO&page=0&size=10',
        expect.anything(),
      ),
    )
  })

  it('ignora status inválido na URL', async () => {
    comTokenSalvo()
    const fetchFalso = vi.fn(
      rotasFalsas({ 'GET /auth/me': [200, maria], 'GET /pedidos': [200, pagina([pedido()])] }),
    )
    vi.stubGlobal('fetch', fetchFalso)

    renderizar('/pedidos?status=QUALQUER')

    await screen.findByRole('link', { name: /Pedido #5/ })
    // /auth/me e /pedidos saem em paralelo: conferimos a chamada, não a ordem
    expect(fetchFalso).toHaveBeenCalledWith('http://localhost:8080/pedidos?page=0&size=10', expect.anything())
    expect(fetchFalso.mock.calls.some(([url]) => String(url).includes('status='))).toBe(false)
  })
})
