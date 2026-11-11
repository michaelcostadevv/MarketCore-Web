// Tipos que espelham os DTOs da MarketCore API (pacote com.marketcore.dto).
// BigDecimal chega no JSON como número: usamos só para exibir. Quem calcula de verdade é a API.

export type Produto = {
  id: number
  nome: string
  preco: number
  quantidade: number
  descricao: string | null
  imagemUrl: string | null
}

/** Página do Spring Data no modo VIA_DTO (@EnableSpringDataWebSupport na API). */
export type Pagina<T> = {
  content: T[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

/** Formato único de erro da API (exception/ErroResposta.java). */
export type ErroApi = {
  timestamp: string
  status: number
  erro: string
  mensagem: string
  caminho: string
  detalhes: string[]
}

/** GET /auth/me */
export type UsuarioLogado = {
  id: number
  email: string
  role: string
  admin: boolean
  clienteId: number | null
  nome: string | null
}

export type StatusPedido = 'PENDENTE' | 'PAGO' | 'ENVIADO' | 'ENTREGUE' | 'CANCELADO'

export type ItemPedido = {
  produtoId: number
  nomeProduto: string
  quantidade: number
  precoUnitario: number
  subTotal: number
}

export type Pedido = {
  id: number
  clienteId: number
  nomeCliente: string
  valorTotal: number
  statusPedido: StatusPedido
  dataPedido: string
  itens: ItemPedido[]
}
