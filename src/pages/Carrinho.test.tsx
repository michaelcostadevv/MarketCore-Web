import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useParams } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { CHAVE_CARRINHO } from '../carrinho/armazenamento'
import { admin, comCarrinhoSalvo, comTokenSalvo, maria, mouse, pedido, teclado } from '../test/dados'
import { renderizarComProvedores, rotasFalsas } from '../test/renderizar'
import { Carrinho } from './Carrinho'

function PaginaPedido() {
  return <p>página do pedido {useParams().id}</p>
}

function renderizarCarrinho() {
  return renderizarComProvedores(
    <Routes>
      <Route path="/carrinho" element={<Carrinho />} />
      <Route path="/pedidos/:id" element={<PaginaPedido />} />
    </Routes>,
    { rota: '/carrinho' },
  )
}

describe('Carrinho', () => {
  it('mostra aviso e link para a vitrine quando está vazio', () => {
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))

    renderizarCarrinho()

    expect(screen.getByText('Seu carrinho está vazio')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver produtos' })).toHaveAttribute('href', '/')
  })

  it('lista os itens com subtotal e o total estimado', () => {
    comCarrinhoSalvo([
      { produto: teclado, quantidade: 2 },
      { produto: mouse, quantidade: 1 },
    ])
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))

    renderizarCarrinho()

    const itemTeclado = screen.getByRole('listitem', { name: 'Teclado' })
    expect(within(itemTeclado).getByText(/R\$\s399,80/)).toBeInTheDocument()
    expect(screen.getByTestId('total')).toHaveTextContent(/R\$\s449,80/)
  })

  it('permite alterar a quantidade e remover itens', async () => {
    comCarrinhoSalvo([
      { produto: teclado, quantidade: 1 },
      { produto: mouse, quantidade: 1 },
    ])
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))
    renderizarCarrinho()

    await userEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade de Teclado' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remover Mouse' }))

    expect(screen.getByLabelText('Quantidade de Teclado')).toHaveValue(2)
    expect(screen.queryByRole('listitem', { name: 'Mouse' })).not.toBeInTheDocument()
  })

  it('pede login para finalizar, voltando ao carrinho depois', () => {
    comCarrinhoSalvo([{ produto: teclado, quantidade: 1 }])
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))

    renderizarCarrinho()

    expect(screen.getByRole('link', { name: 'Entrar para finalizar' })).toHaveAttribute(
      'href',
      '/login?voltar=%2Fcarrinho',
    )
  })

  it('finaliza o pedido: envia os itens, esvazia o carrinho e abre o pedido criado', async () => {
    comTokenSalvo()
    comCarrinhoSalvo([
      { produto: teclado, quantidade: 2 },
      { produto: mouse, quantidade: 1 },
    ])
    const fetchFalso = vi.fn(
      rotasFalsas({ 'GET /auth/me': [200, maria], 'POST /pedidos': [201, pedido({ id: 42 })] }),
    )
    vi.stubGlobal('fetch', fetchFalso)
    renderizarCarrinho()

    await userEvent.click(await screen.findByRole('button', { name: 'Finalizar pedido' }))

    expect(await screen.findByText('página do pedido 42')).toBeInTheDocument()
    const chamada = fetchFalso.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(JSON.parse(String(chamada?.[1]?.body))).toEqual({
      itens: [
        { produtoId: 1, quantidade: 2 },
        { produtoId: 2, quantidade: 1 },
      ],
    })
    expect(JSON.parse(localStorage.getItem(CHAVE_CARRINHO) ?? '[]')).toEqual([])
  })

  it('mostra o erro de estoque da API (422) e mantém o carrinho', async () => {
    comTokenSalvo()
    comCarrinhoSalvo([{ produto: teclado, quantidade: 5 }])
    vi.stubGlobal(
      'fetch',
      vi.fn(
        rotasFalsas({
          'GET /auth/me': [200, maria],
          'POST /pedidos': [
            422,
            { status: 422, mensagem: "Estoque insuficiente para o produto 'Teclado'", detalhes: [] },
          ],
        }),
      ),
    )
    renderizarCarrinho()

    await userEvent.click(await screen.findByRole('button', { name: 'Finalizar pedido' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Estoque insuficiente para o produto 'Teclado'")
    expect(screen.getByRole('listitem', { name: 'Teclado' })).toBeInTheDocument()
  })

  it('avisa que conta de administrador não faz pedidos', async () => {
    comTokenSalvo()
    comCarrinhoSalvo([{ produto: teclado, quantidade: 1 }])
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ 'GET /auth/me': [200, admin] })))

    renderizarCarrinho()

    expect(await screen.findByText(/não possui cadastro de cliente/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Finalizar pedido' })).not.toBeInTheDocument()
  })
})
