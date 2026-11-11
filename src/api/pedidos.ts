import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Pagina, Pedido, StatusPedido } from './types'

/** Nomes dos status para exibir na tela (a API usa o enum em maiúsculas). */
export const ROTULOS_STATUS: Record<StatusPedido, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

export const STATUS_PEDIDO = Object.keys(ROTULOS_STATUS) as StatusPedido[]

/** Cliente só pode cancelar antes do envio (regra do enum StatusPedido na API). */
export function podeCancelar(status: StatusPedido) {
  return status === 'PENDENTE' || status === 'PAGO'
}

export type FiltroPedidos = {
  status?: StatusPedido
  /** Página da API, começando em 0. */
  page: number
  size: number
}

type ItemNovoPedido = { produtoId: number; quantidade: number }

// O dono do pedido NÃO vai no corpo: a API usa o usuário do token.
// Assim ninguém consegue criar pedido em nome de outra pessoa.
export function criarPedido(itens: ItemNovoPedido[]) {
  return api<Pedido>('/pedidos', { method: 'POST', body: JSON.stringify({ itens }) })
}

/** Para um cliente, a API devolve só os pedidos dele ("meus pedidos"). */
export function listarPedidos({ status, page, size }: FiltroPedidos) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  params.set('page', String(page))
  params.set('size', String(size))
  return api<Pagina<Pedido>>(`/pedidos?${params}`)
}

export function buscarPedido(id: number) {
  return api<Pedido>(`/pedidos/${id}`)
}

export function cancelarPedido(id: number) {
  return api<Pedido>(`/pedidos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'CANCELADO' }) })
}

// Chaves do cache. Começam com "pedidos" (dado privado): o logout as apaga (AuthProvider).
const chaves = {
  listas: ['pedidos', 'lista'] as const,
  lista: (filtro: FiltroPedidos) => ['pedidos', 'lista', filtro] as const,
  detalhe: (id: number) => ['pedidos', 'detalhe', id] as const,
}

export function useMeusPedidos(filtro: FiltroPedidos) {
  return useQuery({
    queryKey: chaves.lista(filtro),
    queryFn: () => listarPedidos(filtro),
    placeholderData: keepPreviousData,
  })
}

export function usePedido(id: number) {
  return useQuery({ queryKey: chaves.detalhe(id), queryFn: () => buscarPedido(id) })
}

/**
 * Depois de criar ou cancelar um pedido:
 * - o detalhe recebe a resposta da API direto no cache (sem nova chamada);
 * - as listas de pedidos ficam desatualizadas e são buscadas de novo;
 * - o estoque mudou (baixa na compra, devolução no cancelamento): a vitrine também.
 */
function aoMudarPedido(queryClient: ReturnType<typeof useQueryClient>, pedido: Pedido) {
  queryClient.setQueryData(chaves.detalhe(pedido.id), pedido)
  void queryClient.invalidateQueries({ queryKey: chaves.listas })
  void queryClient.invalidateQueries({ queryKey: ['produtos'] })
}

/**
 * @param aoCriar roda quando o pedido é criado, MESMO que a página já tenha sido fechada.
 *   (O onSuccess passado em mutate() não roda se o componente desmontou: se o carrinho fosse
 *   esvaziado ali, sair da página durante o envio deixaria os itens e geraria pedido duplicado.)
 */
export function useCriarPedido({ aoCriar }: { aoCriar?: (pedido: Pedido) => void } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: criarPedido,
    onSuccess: (pedido) => {
      aoMudarPedido(queryClient, pedido)
      aoCriar?.(pedido)
    },
    // Recusado (estoque, produto removido...): os produtos mudaram na API. Buscar de novo
    // faz o carrinho se conferir e explicar o que mudou.
    onError: () => void queryClient.invalidateQueries({ queryKey: ['produtos'] }),
  })
}

export function useCancelarPedido() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelarPedido,
    onSuccess: (pedido) => aoMudarPedido(queryClient, pedido),
    // Recusado: o status provavelmente mudou (ex.: o pedido foi enviado). Busca o real.
    onError: (_erro, id) => void queryClient.invalidateQueries({ queryKey: chaves.detalhe(id) }),
  })
}
