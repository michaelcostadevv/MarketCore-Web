import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { CHAVE_CARRINHO } from '../carrinho/armazenamento'
import { comCarrinhoSalvo, teclado } from '../test/dados'
import { renderizarComProvedores, rotasFalsas } from '../test/renderizar'
import { ProdutoDetalhe } from './ProdutoDetalhe'

function renderizar(rota: string) {
  return renderizarComProvedores(
    <Routes>
      <Route path="/produtos/:id" element={<ProdutoDetalhe />} />
    </Routes>,
    { rota },
  )
}

describe('ProdutoDetalhe', () => {
  it.each(['abc', '1e30', '0'])('/produtos/%s mostra 404 sem chamar a API', (id) => {
    const fetchFalso = vi.fn()
    vi.stubGlobal('fetch', fetchFalso)

    renderizar(`/produtos/${id}`)

    expect(screen.getByText('Produto não encontrado')).toBeInTheDocument()
    expect(fetchFalso).not.toHaveBeenCalled()
  })

  it('adiciona a quantidade escolhida ao carrinho e oferece ir para ele', async () => {
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ 'GET /produtos/1': [200, teclado] })))
    renderizar('/produtos/1')

    const quantidade = await screen.findByLabelText('Quantidade')
    await userEvent.clear(quantidade)
    await userEvent.type(quantidade, '3')
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }))

    expect(screen.getByRole('status')).toHaveTextContent('Adicionado ao carrinho')
    expect(screen.getByRole('link', { name: 'Ver carrinho' })).toHaveAttribute('href', '/carrinho')
    expect(JSON.parse(localStorage.getItem(CHAVE_CARRINHO) ?? '[]')).toEqual([{ produto: teclado, quantidade: 3 }])
  })

  it('avisa quando o carrinho já tem todo o estoque (em vez de dizer "Adicionado")', async () => {
    comCarrinhoSalvo([{ produto: teclado, quantidade: 5 }]) // estoque: 5
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ 'GET /produtos/1': [200, teclado] })))
    renderizar('/produtos/1')

    await userEvent.click(await screen.findByRole('button', { name: 'Adicionar ao carrinho' }))

    expect(screen.getByRole('status')).toHaveTextContent('Você já tem todo o estoque disponível (5) no carrinho.')
  })

  it('produto esgotado não pode ir para o carrinho', async () => {
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ 'GET /produtos/1': [200, { ...teclado, quantidade: 0 }] })))

    renderizar('/produtos/1')

    expect(await screen.findByRole('button', { name: 'Esgotado' })).toBeDisabled()
  })
})
