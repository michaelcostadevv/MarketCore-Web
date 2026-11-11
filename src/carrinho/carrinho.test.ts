import { describe, expect, it } from 'vitest'
import type { Produto } from '../api/types'
import { adicionar, alterarQuantidade, type ItemCarrinho, quantidadeTotal, remover, total } from './carrinho'

function produto(id: number, preco: number, quantidade = 10): Produto {
  return { id, nome: `Produto ${id}`, preco, quantidade, descricao: null, imagemUrl: null }
}

describe('adicionar', () => {
  it('coloca um produto novo no carrinho', () => {
    expect(adicionar([], produto(1, 10), 2)).toEqual([{ produto: produto(1, 10), quantidade: 2 }])
  })

  it('soma a quantidade quando o produto já está no carrinho', () => {
    const itens = adicionar([], produto(1, 10), 2)

    expect(adicionar(itens, produto(1, 10), 3)).toEqual([{ produto: produto(1, 10), quantidade: 5 }])
  })

  it('não passa do estoque disponível', () => {
    const itens = adicionar([], produto(1, 10, 4), 3)

    expect(adicionar(itens, produto(1, 10, 4), 3)[0].quantidade).toBe(4)
  })

  it('ignora produto esgotado', () => {
    expect(adicionar([], produto(1, 10, 0), 1)).toEqual([])
  })

  it('atualiza preço e estoque com os dados mais recentes do produto', () => {
    const itens = adicionar([], produto(1, 10, 5), 1)

    expect(adicionar(itens, produto(1, 12, 8), 1)[0]).toEqual({ produto: produto(1, 12, 8), quantidade: 2 })
  })

  it('não altera o array original (imutabilidade, exigida pelo React)', () => {
    const itens: ItemCarrinho[] = []
    adicionar(itens, produto(1, 10), 1)

    expect(itens).toEqual([])
  })
})

describe('alterarQuantidade', () => {
  const itens = adicionar([], produto(1, 10, 5), 2)

  it('troca a quantidade de um item', () => {
    expect(alterarQuantidade(itens, 1, 4)[0].quantidade).toBe(4)
  })

  it.each([
    [0, 1],
    [-3, 1],
    [99, 5],
    [Number.NaN, 1],
    [2.7, 2],
  ])('quantidade %s vira %s (fica entre 1 e o estoque)', (pedida, esperada) => {
    expect(alterarQuantidade(itens, 1, pedida)[0].quantidade).toBe(esperada)
  })
})

describe('remover', () => {
  it('tira o produto do carrinho', () => {
    const itens = adicionar(adicionar([], produto(1, 10), 1), produto(2, 5), 1)

    expect(remover(itens, 1).map((i) => i.produto.id)).toEqual([2])
  })
})

describe('total e quantidadeTotal', () => {
  it('somam preço × quantidade sem erro de arredondamento', () => {
    const itens = adicionar(adicionar([], produto(1, 10.5), 2), produto(2, 3), 1)

    expect(total(itens)).toBe(24)
    expect(quantidadeTotal(itens)).toBe(3)
  })

  it('evita o erro clássico de ponto flutuante (0,1 + 0,2)', () => {
    const itens = adicionar(adicionar([], produto(1, 0.1), 1), produto(2, 0.2), 1)

    expect(total(itens)).toBe(0.3)
  })
})
