import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Produto } from '../api/types'
import { ProdutoCard } from './ProdutoCard'

const teclado: Produto = {
  id: 7,
  nome: 'Teclado Mecânico',
  preco: 199.9,
  quantidade: 3,
  descricao: 'Switches azuis',
  imagemUrl: 'https://exemplo.com/teclado.png',
}

function renderizar(produto: Produto) {
  // MemoryRouter: o card tem <Link>, que só funciona dentro de um roteador
  return render(
    <MemoryRouter>
      <ProdutoCard produto={produto} />
    </MemoryRouter>,
  )
}

describe('ProdutoCard', () => {
  it('mostra nome, preço em reais e link para o detalhe', () => {
    renderizar(teclado)

    expect(screen.getByText('Teclado Mecânico')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s199,90/)).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/produtos/7')
  })

  it('mostra a imagem quando há imagemUrl', () => {
    renderizar(teclado)

    expect(screen.getByRole('img', { name: 'Teclado Mecânico' })).toHaveAttribute(
      'src',
      'https://exemplo.com/teclado.png',
    )
  })

  it('mostra um placeholder (e nenhum <img>) quando imagemUrl é nula', () => {
    renderizar({ ...teclado, imagemUrl: null })

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Sem imagem')).toBeInTheDocument()
  })

  it('indica produto esgotado quando a quantidade é zero', () => {
    renderizar({ ...teclado, quantidade: 0 })

    expect(screen.getByText('Esgotado')).toBeInTheDocument()
  })
})
