import type { ErroApi } from './types'

/**
 * Endereço da API. Vem de VITE_API_URL (arquivo .env); sem ele, usa a API local.
 * Só variáveis com prefixo VITE_ chegam ao navegador, então nunca coloque segredos aqui.
 */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

/** Erro de qualquer chamada à API, já no formato que as telas precisam para exibir. */
export class ApiError extends Error {
  /** Status HTTP. 0 significa que nem chegou resposta (API desligada, sem rede, CORS). */
  readonly status: number
  /** Erros de validação por campo (ex.: "email: E-mail inválido"). */
  readonly detalhes: string[]

  constructor(status: number, mensagem: string, detalhes: string[] = []) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.detalhes = detalhes
  }
}

// O client não sabe onde o token fica guardado: quem sabe é o módulo de autenticação,
// que registra estas funções. Assim evitamos dependência circular entre api/ e auth/.
let obterToken: () => string | null = () => null
let aoDesautorizar: () => void = () => {}

export function setTokenProvider(fn: () => string | null) {
  obterToken = fn
}

export function setOnUnauthorized(fn: () => void) {
  aoDesautorizar = fn
}

/**
 * Faz uma chamada à API e devolve o JSON da resposta já tipado.
 * Respostas fora da faixa 2xx viram ApiError, com a mensagem que a própria API mandou.
 */
export async function api<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = obterToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  let resposta: Response
  try {
    resposta = await fetch(`${API_URL}${caminho}`, { ...init, headers })
  } catch {
    // fetch só rejeita quando não há resposta nenhuma: rede, API fora do ar ou bloqueio de CORS
    throw new ApiError(0, 'Não foi possível conectar à API')
  }

  if (!resposta.ok) {
    if (resposta.status === 401) aoDesautorizar()
    const corpo = await lerJson<Partial<ErroApi>>(resposta)
    throw new ApiError(
      resposta.status,
      corpo?.mensagem ?? `Erro ${resposta.status} ao chamar a API`,
      corpo?.detalhes ?? [],
    )
  }

  if (resposta.status === 204) return undefined as T
  return (await lerJson<T>(resposta)) as T
}

/** Lê o corpo como JSON; devolve null se vier vazio ou não for JSON (ex.: 403 sem corpo). */
async function lerJson<T>(resposta: Response): Promise<T | null> {
  const texto = await resposta.text()
  if (!texto) return null
  try {
    return JSON.parse(texto) as T
  } catch {
    return null
  }
}

/**
 * Regra de nova tentativa para o TanStack Query (opção "retry").
 * Erros 4xx (404, 401, 422...) não mudam se repetirmos a chamada: mostramos na hora.
 * Falha de rede (status 0) e 5xx podem ser passageiros: tentamos mais uma vez.
 */
export function deveTentarDeNovo(tentativasFeitas: number, erro: unknown): boolean {
  if (erro instanceof ApiError && erro.status >= 400 && erro.status < 500) return false
  return tentativasFeitas < 1
}
