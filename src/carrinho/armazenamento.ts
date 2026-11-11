import type { ItemCarrinho } from './carrinho'

export const CHAVE_CARRINHO = 'marketcore.carrinho'

/** A API aceita no máximo 100 itens por pedido. */
const MAX_ITENS = 100

/**
 * Lê o carrinho salvo. O localStorage é editável por qualquer um (e pode vir de uma versão
 * antiga do app), então conferimos cada item antes de confiar nele. Itens inválidos são
 * descartados um a um, sem derrubar os outros. Ao abrir o carrinho, os produtos ainda são
 * conferidos com a API (sincronizar), então aqui basta garantir o formato.
 */
export function lerCarrinhoSalvo(): ItemCarrinho[] {
  try {
    const salvo: unknown = JSON.parse(localStorage.getItem(CHAVE_CARRINHO) ?? '[]')
    return Array.isArray(salvo) ? salvo.filter(ehItemValido).slice(0, MAX_ITENS) : []
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
    typeof produto === 'object' &&
    produto !== null &&
    Number.isInteger(produto.id) &&
    typeof produto.nome === 'string' &&
    typeof produto.preco === 'number' &&
    produto.preco >= 0 &&
    Number.isInteger(produto.quantidade) &&
    Number.isInteger(quantidade) &&
    (quantidade ?? 0) >= 1
  )
}
