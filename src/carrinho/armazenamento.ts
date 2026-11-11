import type { ItemCarrinho } from './carrinho'

export const CHAVE_CARRINHO = 'marketcore.carrinho'

/**
 * Lê o carrinho salvo. O localStorage é editável por qualquer um (e pode vir de uma versão
 * antiga do app), então conferimos o formato antes de confiar nele. Se não bater, começamos
 * com o carrinho vazio em vez de quebrar a página.
 */
export function lerCarrinhoSalvo(): ItemCarrinho[] {
  try {
    const salvo: unknown = JSON.parse(localStorage.getItem(CHAVE_CARRINHO) ?? '[]')
    return Array.isArray(salvo) && salvo.every(ehItemValido) ? salvo : []
  } catch {
    return []
  }
}

export function salvarCarrinho(itens: ItemCarrinho[]) {
  try {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens))
  } catch {
    // sem armazenamento: o carrinho vale só até o F5
  }
}

function ehItemValido(item: unknown): item is ItemCarrinho {
  if (typeof item !== 'object' || item === null) return false
  const { produto, quantidade } = item as Partial<ItemCarrinho>
  return (
    Number.isInteger(quantidade) &&
    (quantidade ?? 0) >= 1 &&
    typeof produto === 'object' &&
    produto !== null &&
    Number.isInteger(produto.id) &&
    typeof produto.nome === 'string' &&
    typeof produto.preco === 'number' &&
    Number.isInteger(produto.quantidade)
  )
}
