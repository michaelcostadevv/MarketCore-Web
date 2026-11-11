import { useContext } from 'react'
import { CarrinhoContext } from './contexto'

/** Acesso ao carrinho em qualquer componente: const { itens, adicionar } = useCarrinho() */
export function useCarrinho() {
  const valor = useContext(CarrinhoContext)
  if (!valor) throw new Error('useCarrinho precisa estar dentro de <CarrinhoProvider>')
  return valor
}
