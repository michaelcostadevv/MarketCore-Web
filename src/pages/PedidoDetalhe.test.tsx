import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { StatusPedido } from '../api/types'
import { comTokenSalvo, maria, pedido } from '../test/dados'
import { renderizarComProvedores, rotasFalsas } from '../test/renderizar'
import { PedidoDetalhe } from './PedidoDetalhe'

function renderizar(rota = '/pedidos/5') {
  return renderizarComProvedores(
    <Routes>
      <Route path="/pedidos/:id" element={<PedidoDetalhe />} />
    </Routes>,
    { rota },
  )
}

describe('PedidoDetalhe', () => {
  it('mostra itens, subtotais, total, status e data', async () => {
    comTokenSalvo()
    vi.stubGlobal(
      'fetch',
      vi.fn(rotasFalsas({ 'GET /auth/me': [200, maria], 'GET /pedidos/5': [200, pedido()] })),
    )

    renderizar()

    expect(await screen.findByRole('heading', { name: 'Pedido #5' })).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.getByText('09/11/2026, 21:05')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Teclado/ })).toHaveTextContent(/2.*R\$\s199,90.*R\$\s399,80/)
    expect(screen.getByTestId('total')).toHaveTextContent(/R\$\s449,80/)
  })

  it('cancela um pedido pendente depois de confirmar', async () => {
    comTokenSalvo()
    const fetchFalso = vi.fn(
      rotasFalsas({
        'GET /auth/me': [200, maria],
        'GET /pedidos/5': [200, pedido()],
        'PATCH /pedidos/5/status': [200, pedido({ statusPedido: 'CANCELADO' })],
      }),
    )
    vi.stubGlobal('fetch', fetchFalso)
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar' }))

    expect(await screen.findByText('Cancelado')).toBeInTheDocument()
    const chamada = fetchFalso.mock.calls.find(([, init]) => init?.method === 'PATCH')
    expect(JSON.parse(String(chamada?.[1]?.body))).toEqual({ status: 'CANCELADO' })
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument()
  })

  it('desistir da confirmação não chama a API', async () => {
    comTokenSalvo()
    const fetchFalso = vi.fn(rotasFalsas({ 'GET /auth/me': [200, maria], 'GET /pedidos/5': [200, pedido()] }))
    vi.stubGlobal('fetch', fetchFalso)
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
    await userEvent.click(screen.getByRole('button', { name: 'Não' }))

    expect(screen.getByRole('button', { name: 'Cancelar pedido' })).toBeInTheDocument()
    expect(fetchFalso.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false)
  })

  it.each<StatusPedido>(['ENVIADO', 'ENTREGUE', 'CANCELADO'])('não oferece cancelamento para %s', async (status) => {
    comTokenSalvo()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        rotasFalsas({ 'GET /auth/me': [200, maria], 'GET /pedidos/5': [200, pedido({ statusPedido: status })] }),
      ),
    )

    renderizar()

    await screen.findByRole('heading', { name: 'Pedido #5' })
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument()
  })

  it('mostra o erro da API se o cancelamento for recusado (422)', async () => {
    comTokenSalvo()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        rotasFalsas({
          'GET /auth/me': [200, maria],
          'GET /pedidos/5': [200, pedido({ statusPedido: 'PAGO' })],
          'PATCH /pedidos/5/status': [
            422,
            { status: 422, mensagem: 'Não é possível mudar o status de ENVIADO para CANCELADO', detalhes: [] },
          ],
        }),
      ),
    )
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não é possível mudar o status')
  })

  it.each(['/pedidos/999', '/pedidos/abc'])('%s mostra "Pedido não encontrado"', async (rota) => {
    comTokenSalvo()
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ 'GET /auth/me': [200, maria] }))) // /pedidos/999 → 404

    renderizar(rota)

    expect(await screen.findByText('Pedido não encontrado')).toBeInTheDocument()
  })
})
