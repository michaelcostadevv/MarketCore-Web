import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, Route, Routes, useParams } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { CHAVE_CARRINHO } from '../carrinho/armazenamento'
import { admin, comCarrinhoSalvo, comTokenSalvo, maria, mouse, pedido, teclado } from '../test/dados'
import { type RespostaFalsa, renderizarComProvedores, rotasFalsas } from '../test/renderizar'
import { Carrinho } from './Carrinho'

/** Ao abrir o carrinho, ele confere os produtos na API: por padrão, nada mudou. */
const produtosNaApi: Record<string, RespostaFalsa> = {
  'GET /produtos/1': [200, teclado],
  'GET /produtos/2': [200, mouse],
}

function PaginaPedido() {
  return <p>página do pedido {useParams().id}</p>
}

function renderizarCarrinho() {
  return renderizarComProvedores(
    <>
      <Link to="/">ir para a vitrine</Link>
      <Routes>
        <Route path="/" element={<p>página: vitrine</p>} />
        <Route path="/carrinho" element={<Carrinho />} />
        <Route path="/pedidos/:id" element={<PaginaPedido />} />
      </Routes>
    </>,
    { rota: '/carrinho' },
  )
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const carrinhoSalvo = () => JSON.parse(localStorage.getItem(CHAVE_CARRINHO) ?? '[]')

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
    vi.stubGlobal('fetch', vi.fn(rotasFalsas(produtosNaApi)))

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
    vi.stubGlobal('fetch', vi.fn(rotasFalsas(produtosNaApi)))
    renderizarCarrinho()

    await userEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade de Teclado' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remover Mouse' }))

    expect(screen.getByLabelText('Quantidade de Teclado')).toHaveValue(2)
    expect(screen.queryByRole('listitem', { name: 'Mouse' })).not.toBeInTheDocument()
  })

  it('o campo de quantidade aceita apagar e digitar, e limita ao estoque ao sair do campo', async () => {
    comCarrinhoSalvo([{ produto: teclado, quantidade: 1 }]) // estoque: 5
    vi.stubGlobal('fetch', vi.fn(rotasFalsas(produtosNaApi)))
    renderizarCarrinho()
    const campo = screen.getByLabelText('Quantidade de Teclado')

    await userEvent.clear(campo)
    expect(campo).toHaveValue(null) // continua vazio enquanto a pessoa digita
    await userEvent.type(campo, '3')
    await userEvent.tab()
    expect(carrinhoSalvo()[0].quantidade).toBe(3)

    await userEvent.clear(campo)
    await userEvent.type(campo, '99{Enter}')
    expect(campo).toHaveValue(5)
    expect(campo).toHaveFocus() // Enter não tira o foco de quem usa o teclado
    expect(screen.getByText('máx. 5')).toBeInTheDocument()
  })

  it('confere o carrinho com a API ao abrir: ajusta ao estoque atual e explica o que mudou', async () => {
    comCarrinhoSalvo([
      { produto: teclado, quantidade: 5 },
      { produto: mouse, quantidade: 1 },
    ])
    vi.stubGlobal(
      'fetch',
      vi.fn(
        rotasFalsas({
          'GET /produtos/1': [200, { ...teclado, quantidade: 2 }],
          'GET /produtos/2': [404, { status: 404, mensagem: 'Produto não encontrado', detalhes: [] }],
        }),
      ),
    )

    renderizarCarrinho()

    const avisos = screen.getByRole('status', { name: 'Carrinho atualizado' }) // região viva já existe, vazia
    await waitFor(() =>
      expect(avisos).toHaveTextContent('A quantidade de "Teclado" foi ajustada para 2 (estoque disponível).'),
    )
    expect(avisos).toHaveTextContent('"Mouse" não está mais à venda e saiu do carrinho.')
    expect(screen.getByLabelText('Quantidade de Teclado')).toHaveValue(2)
    expect(screen.queryByRole('listitem', { name: 'Mouse' })).not.toBeInTheDocument()
  })

  it('pede login para finalizar, voltando ao carrinho depois', () => {
    comCarrinhoSalvo([{ produto: teclado, quantidade: 1 }])
    vi.stubGlobal('fetch', vi.fn(rotasFalsas(produtosNaApi)))

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
      rotasFalsas({ ...produtosNaApi, 'GET /auth/me': [200, maria], 'POST /pedidos': [201, pedido({ id: 42 })] }),
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
    expect(carrinhoSalvo()).toEqual([])
  })

  it('esvazia o carrinho mesmo se a pessoa sair da página antes de o pedido ser criado (evita pedido duplicado)', async () => {
    comTokenSalvo()
    comCarrinhoSalvo([{ produto: teclado, quantidade: 1 }])
    let responderPost: (r: Response) => void = () => {}
    const rotas = rotasFalsas({ ...produtosNaApi, 'GET /auth/me': [200, maria] })
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((url, init) =>
        init?.method === 'POST' ? new Promise<Response>((r) => (responderPost = r)) : rotas(url, init),
      ),
    )
    renderizarCarrinho()

    await userEvent.click(await screen.findByRole('button', { name: 'Finalizar pedido' }))
    await userEvent.click(screen.getByRole('link', { name: 'ir para a vitrine' }))
    expect(screen.getByText('página: vitrine')).toBeInTheDocument()
    await act(async () => responderPost(json(201, pedido({ id: 43 }))))

    expect(carrinhoSalvo()).toEqual([])
  })

  it('se a API recusar por estoque (422), mostra o erro, confere o carrinho de novo e explica o ajuste', async () => {
    comTokenSalvo()
    comCarrinhoSalvo([{ produto: teclado, quantidade: 5 }])
    let estoqueNaApi = 5 // alguém comprou enquanto a pessoa decidia
    const rotas = rotasFalsas({
      'GET /auth/me': [200, maria],
      'POST /pedidos': [422, { status: 422, mensagem: "Estoque insuficiente para o produto 'Teclado'", detalhes: [] }],
    })
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((url, init) => {
        if (String(url).endsWith('/produtos/1')) return Promise.resolve(json(200, { ...teclado, quantidade: estoqueNaApi }))
        if (init?.method === 'POST') estoqueNaApi = 1
        return rotas(url, init)
      }),
    )
    renderizarCarrinho()

    await userEvent.click(await screen.findByRole('button', { name: 'Finalizar pedido' }))

    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'Carrinho atualizado' })).toHaveTextContent(
        'A quantidade de "Teclado" foi ajustada para 1 (estoque disponível).',
      ),
    )
    expect(screen.getByLabelText('Quantidade de Teclado')).toHaveValue(1)
  })

  it('mostra o erro da API e mantém o carrinho quando não há o que ajustar', async () => {
    comTokenSalvo()
    comCarrinhoSalvo([{ produto: teclado, quantidade: 5 }])
    vi.stubGlobal(
      'fetch',
      vi.fn(
        rotasFalsas({
          ...produtosNaApi,
          'GET /auth/me': [200, maria],
          'POST /pedidos': [409, { status: 409, mensagem: 'O registro foi alterado por outra operação', detalhes: [] }],
        }),
      ),
    )
    renderizarCarrinho()

    await userEvent.click(await screen.findByRole('button', { name: 'Finalizar pedido' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('O registro foi alterado por outra operação')
    expect(screen.getByRole('listitem', { name: 'Teclado' })).toBeInTheDocument()

    // mexer no carrinho tira a mensagem antiga da tela
    fireEvent.click(screen.getByRole('button', { name: 'Diminuir quantidade de Teclado' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('avisa que conta de administrador não faz pedidos', async () => {
    comTokenSalvo()
    comCarrinhoSalvo([{ produto: teclado, quantidade: 1 }])
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ ...produtosNaApi, 'GET /auth/me': [200, admin] })))

    renderizarCarrinho()

    expect(await screen.findByText(/não possui cadastro de cliente/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Finalizar pedido' })).not.toBeInTheDocument()
  })
})
