import { createContext } from 'react'
import type { Produto } from '../api/types'
import type { ItemCarrinho } from './carrinho'

export type ValorCarrinho = {
  itens: ItemCarrinho[]
  /** Soma das quantidades (para o número no ícone do carrinho). */
  quantidadeItens: number
  /** Total estimado em reais. O valor oficial é o que a API calcula no pedido. */
  total: number
  adicionar: (produto: Produto, quantidade?: number) => void
  alterarQuantidade: (produtoId: number, quantidade: number) => void
  remover: (produtoId: number) => void
  /** Troca todos os itens de uma vez (usado ao sincronizar com a API). */
  substituir: (itens: ItemCarrinho[]) => void
  limpar: () => void
}

export const CarrinhoContext = createContext<ValorCarrinho | null>(null)
