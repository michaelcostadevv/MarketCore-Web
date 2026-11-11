import type { Produto } from '../api/types'

// Regras do carrinho como FUNÇÕES PURAS: recebem os itens e devolvem um array novo,
// sem efeitos colaterais e sem React. São fáceis de testar e de reaproveitar.
// Nunca alteram o array recebido: o React só percebe mudanças quando o estado é um objeto novo.

export type ItemCarrinho = {
  /** Cópia do produto no momento em que entrou no carrinho (preço e estoque podem mudar na API). */
  produto: Produto
  quantidade: number
}

/** Mantém a quantidade entre 1 e o estoque do produto (e sempre inteira). */
function limitar(quantidade: number, produto: Produto): number {
  const inteira = Number.isFinite(quantidade) ? Math.floor(quantidade) : 1
  return Math.min(Math.max(inteira, 1), produto.quantidade)
}

export function adicionar(itens: ItemCarrinho[], produto: Produto, quantidade = 1): ItemCarrinho[] {
  if (produto.quantidade <= 0) return itens // esgotado

  const existente = itens.find((i) => i.produto.id === produto.id)
  if (!existente) return [...itens, { produto, quantidade: limitar(quantidade, produto) }]

  return itens.map((i) =>
    i.produto.id === produto.id
      ? { produto, quantidade: limitar(i.quantidade + quantidade, produto) } // usa os dados mais novos
      : i,
  )
}

export function alterarQuantidade(itens: ItemCarrinho[], produtoId: number, quantidade: number): ItemCarrinho[] {
  return itens.map((i) => (i.produto.id === produtoId ? { ...i, quantidade: limitar(quantidade, i.produto) } : i))
}

export function remover(itens: ItemCarrinho[], produtoId: number): ItemCarrinho[] {
  return itens.filter((i) => i.produto.id !== produtoId)
}

/**
 * Total estimado. Soma em centavos (inteiros) para fugir do erro de ponto flutuante
 * (0.1 + 0.2 = 0.30000000000000004). O valor oficial é o que a API calcula no pedido.
 */
export function total(itens: ItemCarrinho[]): number {
  const centavos = itens.reduce((soma, i) => soma + Math.round(i.produto.preco * 100) * i.quantidade, 0)
  return centavos / 100
}

export function quantidadeTotal(itens: ItemCarrinho[]): number {
  return itens.reduce((soma, i) => soma + i.quantidade, 0)
}
