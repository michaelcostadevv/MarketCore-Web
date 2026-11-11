import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { Pagina, Produto } from './types'

export type FiltroProdutos = {
  nome?: string
  /** Página da API, começando em 0. */
  page: number
  size: number
}

export function listarProdutos({ nome, page, size }: FiltroProdutos) {
  const params = new URLSearchParams()
  if (nome) params.set('nome', nome)
  params.set('page', String(page))
  params.set('size', String(size))
  return api<Pagina<Produto>>(`/produtos?${params}`)
}

export function buscarProduto(id: number) {
  return api<Produto>(`/produtos/${id}`)
}

// Hooks do TanStack Query. A "queryKey" identifica os dados no cache:
// mesma chave = mesmos dados, sem nova chamada à API enquanto estiverem frescos.

export function useProdutos(filtro: FiltroProdutos) {
  return useQuery({
    queryKey: ['produtos', filtro],
    queryFn: () => listarProdutos(filtro),
    // Ao trocar de página, mantém a lista anterior na tela até a nova chegar (sem "piscar")
    placeholderData: keepPreviousData,
  })
}

export function useProduto(id: number) {
  return useQuery({
    queryKey: ['produtos', id],
    queryFn: () => buscarProduto(id),
  })
}
