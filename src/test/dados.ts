import type { Pedido, Produto, UsuarioLogado } from '../api/types'
import { CHAVE_TOKEN } from '../auth/token'
import { CHAVE_CARRINHO } from '../carrinho/armazenamento'
import type { ItemCarrinho } from '../carrinho/carrinho'

// Dados de exemplo compartilhados pelos testes ("fixtures").

export const maria: UsuarioLogado = {
  id: 3,
  email: 'maria@exemplo.com',
  role: 'ROLE_USER',
  admin: false,
  clienteId: 10,
  nome: 'Maria',
}

export const admin: UsuarioLogado = {
  id: 1,
  email: 'admin@marketcore.com',
  role: 'ROLE_ADMIN',
  admin: true,
  clienteId: null,
  nome: null,
}

export const teclado: Produto = {
  id: 1,
  nome: 'Teclado',
  preco: 199.9,
  quantidade: 5,
  descricao: null,
  imagemUrl: null,
}

export const mouse: Produto = { id: 2, nome: 'Mouse', preco: 50, quantidade: 10, descricao: null, imagemUrl: null }

export function pedido(dados: Partial<Pedido> = {}): Pedido {
  return {
    id: 5,
    clienteId: 10,
    nomeCliente: 'Maria',
    valorTotal: 449.8,
    statusPedido: 'PENDENTE',
    dataPedido: '2026-11-09T21:05:00',
    itens: [
      { produtoId: 1, nomeProduto: 'Teclado', quantidade: 2, precoUnitario: 199.9, subTotal: 399.8 },
      { produtoId: 2, nomeProduto: 'Mouse', quantidade: 1, precoUnitario: 50, subTotal: 50 },
    ],
    ...dados,
  }
}

/** Simula uma visita anterior: token salvo (a sessão é confirmada via GET /auth/me). */
export function comTokenSalvo(token = 'tok') {
  localStorage.setItem(CHAVE_TOKEN, token)
}

/** Simula um carrinho salvo numa visita anterior. */
export function comCarrinhoSalvo(itens: ItemCarrinho[]) {
  localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens))
}
