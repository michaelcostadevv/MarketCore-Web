import type { Produto } from '../api/types'
import { formatarPreco } from '../lib/formatar'

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

export type ResultadoSincronizacao = {
  itens: ItemCarrinho[]
  /** Frases para mostrar ao usuário explicando o que mudou. */
  avisos: string[]
  mudou: boolean
}

/**
 * Confere o carrinho com os produtos atuais da API.
 *
 * @param atuais produto atual por id; null = não existe mais (404). Ids ausentes do mapa
 *               (ex.: falha de rede ao conferir) ficam como estão.
 */
export function sincronizar(itens: ItemCarrinho[], atuais: Map<number, Produto | null>): ResultadoSincronizacao {
  const avisos: string[] = []
  let mudou = false
  const novos: ItemCarrinho[] = []

  for (const item of itens) {
    if (!atuais.has(item.produto.id)) {
      novos.push(item)
      continue
    }
    const atual = atuais.get(item.produto.id) ?? null
    const nome = item.produto.nome

    if (atual === null) {
      avisos.push(`"${nome}" não está mais à venda e saiu do carrinho.`)
      mudou = true
      continue
    }
    if (atual.quantidade <= 0) {
      avisos.push(`"${nome}" esgotou e saiu do carrinho.`)
      mudou = true
      continue
    }

    const quantidade = Math.min(item.quantidade, atual.quantidade)
    if (quantidade < item.quantidade) {
      avisos.push(`A quantidade de "${nome}" foi ajustada para ${quantidade} (estoque disponível).`)
    }
    if (atual.preco !== item.produto.preco) {
      avisos.push(`O preço de "${nome}" mudou para ${formatarPreco(atual.preco)}.`)
    }
    if (quantidade !== item.quantidade || JSON.stringify(atual) !== JSON.stringify(item.produto)) {
      mudou = true
      novos.push({ produto: atual, quantidade })
    } else {
      novos.push(item)
    }
  }

  // Sem mudanças, devolve o MESMO array: o React não renderiza de novo à toa
  return { itens: mudou ? novos : itens, avisos, mudou }
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
