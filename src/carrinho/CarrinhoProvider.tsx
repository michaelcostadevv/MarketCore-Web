import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { CHAVE_CARRINHO, lerCarrinhoSalvo, salvarCarrinho } from './armazenamento'
import * as regras from './carrinho'
import { CarrinhoContext, type ValorCarrinho } from './contexto'

/**
 * Estado do carrinho, salvo no navegador. O carrinho é do dispositivo, não da conta:
 * dá para montar o carrinho antes de entrar (como na maioria das lojas).
 */
export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState(lerCarrinhoSalvo)

  // Toda mudança vai para o localStorage
  useEffect(() => salvarCarrinho(itens), [itens])

  // Mudou em outra aba? Lê de novo. (O evento só dispara quando o valor muda de verdade,
  // então gravar o mesmo valor aqui não cria um ciclo entre as abas.)
  useEffect(() => {
    function aoMudarEmOutraAba(evento: StorageEvent) {
      if (evento.key === CHAVE_CARRINHO || evento.key === null) setItens(lerCarrinhoSalvo())
    }
    window.addEventListener('storage', aoMudarEmOutraAba)
    return () => window.removeEventListener('storage', aoMudarEmOutraAba)
  }, [])

  const valor = useMemo<ValorCarrinho>(
    () => ({
      itens,
      quantidadeItens: regras.quantidadeTotal(itens),
      total: regras.total(itens),
      // A forma "setItens(atuais => ...)" usa sempre o estado mais recente,
      // mesmo com vários cliques seguidos antes de o React renderizar de novo
      adicionar: (produto, quantidade = 1) => setItens((atuais) => regras.adicionar(atuais, produto, quantidade)),
      alterarQuantidade: (produtoId, quantidade) =>
        setItens((atuais) => regras.alterarQuantidade(atuais, produtoId, quantidade)),
      remover: (produtoId) => setItens((atuais) => regras.remover(atuais, produtoId)),
      limpar: () => setItens([]),
    }),
    [itens],
  )

  return <CarrinhoContext value={valor}>{children}</CarrinhoContext>
}
