import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { Pagina, Produto } from '../api/types'
import { fetchRespondendo, renderizarComProvedores } from '../test/renderizar'
import { Vitrine } from './Vitrine'

function pagina(produtos: Produto[], { number = 0, totalPages = 1 } = {}): Pagina<Produto> {
  return {
    content: produtos,
    page: { size: 12, number, totalElements: produtos.length, totalPages },
  }
}

const produtos: Produto[] = [
  { id: 1, nome: 'Teclado', preco: 199.9, quantidade: 5, descricao: null, imagemUrl: null },
  { id: 2, nome: 'Mouse', preco: 89.5, quantidade: 0, descricao: null, imagemUrl: null },
]

function renderizarVitrine(rota = '/') {
  return renderizarComProvedores(
    <Routes>
      <Route path="/" element={<Vitrine />} />
    </Routes>,
    { rota },
  )
}

describe('Vitrine', () => {
  it('lista os produtos vindos da API', async () => {
    vi.stubGlobal('fetch', vi.fn(fetchRespondendo(pagina(produtos))))

    renderizarVitrine()

    expect(await screen.findByText('Teclado')).toBeInTheDocument()
    expect(screen.getByText('Mouse')).toBeInTheDocument()
  })

  it('pede a primeira página com 12 itens', async () => {
    const fetchFalso = vi.fn(fetchRespondendo(pagina(produtos)))
    vi.stubGlobal('fetch', fetchFalso)

    renderizarVitrine()

    await screen.findByText('Teclado')
    expect(fetchFalso.mock.calls[0][0]).toBe('http://localhost:8080/produtos?page=0&size=12')
  })

  it('anuncia o carregamento para leitores de tela', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {}))) // nunca responde

    renderizarVitrine()

    expect(screen.getByRole('status')).toHaveTextContent('Carregando produtos…')
  })

  it('marca a lista como ocupada (aria-busy) enquanto troca de página', async () => {
    let responder: (r: Response) => void = () => {}
    const fetchFalso = vi.fn<typeof fetch>((url) =>
      String(url).includes('page=1')
        ? new Promise<Response>((r) => (responder = r))
        : fetchRespondendo(pagina(produtos, { totalPages: 2 }))(url),
    )
    vi.stubGlobal('fetch', fetchFalso)
    renderizarVitrine()
    await screen.findByText('Teclado')

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(screen.getByRole('list', { name: 'Produtos' })).toHaveAttribute('aria-busy', 'true')
    responder(new Response(JSON.stringify(pagina(produtos, { number: 1, totalPages: 2 }))))
    await vi.waitFor(() =>
      expect(screen.getByRole('list', { name: 'Produtos' })).toHaveAttribute('aria-busy', 'false'),
    )
  })

  it('mostra aviso quando não há produtos', async () => {
    vi.stubGlobal('fetch', vi.fn(fetchRespondendo(pagina([]))))

    renderizarVitrine()

    expect(await screen.findByText('Nenhum produto encontrado')).toBeInTheDocument()
  })

  it('mostra a mensagem de erro quando a API está desligada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    renderizarVitrine()

    expect(await screen.findByText('Não foi possível conectar à API')).toBeInTheDocument()
  })

  it('busca pelo nome digitado', async () => {
    const fetchFalso = vi.fn(fetchRespondendo(pagina(produtos)))
    vi.stubGlobal('fetch', fetchFalso)
    renderizarVitrine()
    await screen.findByText('Teclado')

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar produtos' }), 'tecl ado{Enter}')

    await vi.waitFor(() =>
      expect(fetchFalso).toHaveBeenLastCalledWith(
        'http://localhost:8080/produtos?nome=tecl+ado&page=0&size=12',
        expect.anything(),
      ),
    )
  })

  it('lê a busca e a página da URL e permite ir para a próxima página', async () => {
    const fetchFalso = vi.fn(fetchRespondendo(pagina(produtos, { number: 1, totalPages: 3 })))
    vi.stubGlobal('fetch', fetchFalso)

    renderizarVitrine('/?nome=mouse&pagina=2')

    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument()
    expect(fetchFalso.mock.calls[0][0]).toBe('http://localhost:8080/produtos?nome=mouse&page=1&size=12')

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    await vi.waitFor(() =>
      expect(fetchFalso).toHaveBeenLastCalledWith(
        'http://localhost:8080/produtos?nome=mouse&page=2&size=12',
        expect.anything(),
      ),
    )
  })

  it('desabilita "Anterior" na primeira página', async () => {
    vi.stubGlobal('fetch', vi.fn(fetchRespondendo(pagina(produtos, { totalPages: 2 }))))

    renderizarVitrine()

    expect(await screen.findByRole('button', { name: 'Anterior' })).toBeDisabled()
  })
})

describe('Vitrine com página inválida na URL', () => {
  it.each(['abc', '1.5', '1e10', '-3'])('?pagina=%s vira a página 1', async (valor) => {
    const fetchFalso = vi.fn(fetchRespondendo(pagina(produtos, { totalPages: 3 })))
    vi.stubGlobal('fetch', fetchFalso)

    renderizarVitrine(`/?pagina=${valor}`)

    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument()
    expect(fetchFalso.mock.calls[0][0]).toBe('http://localhost:8080/produtos?page=0&size=12')
  })

  it('volta para a última página quando a URL pede uma página que não existe', async () => {
    const paginaVazia = fetchRespondendo(pagina([], { number: 8, totalPages: 3 }))
    const ultimaPagina = fetchRespondendo(pagina(produtos, { number: 2, totalPages: 3 }))
    const fetchFalso = vi.fn<typeof fetch>((url, init) =>
      String(url).includes('page=8') ? paginaVazia(url, init) : ultimaPagina(url, init),
    )
    vi.stubGlobal('fetch', fetchFalso)

    renderizarVitrine('/?pagina=9')

    expect(await screen.findByText('Página 3 de 3')).toBeInTheDocument()
    expect(fetchFalso).toHaveBeenLastCalledWith('http://localhost:8080/produtos?page=2&size=12', expect.anything())
  })
})
