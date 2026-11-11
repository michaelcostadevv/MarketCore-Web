import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, deveTentarDeNovo, setOnUnauthorized, setTokenProvider } from './client'

/** Simula uma resposta do fetch com corpo JSON (ou sem corpo, se body for undefined). */
function respostaFalsa(status: number, body?: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    }),
  )
}

describe('api()', () => {
  afterEach(() => {
    setTokenProvider(() => null)
    setOnUnauthorized(() => {})
  })

  it('devolve o JSON quando a resposta é 2xx', async () => {
    vi.stubGlobal('fetch', respostaFalsa(200, { id: 1, nome: 'Teclado' }))

    await expect(api('/produtos/1')).resolves.toEqual({ id: 1, nome: 'Teclado' })
  })

  it('chama a URL da API com o caminho informado', async () => {
    const fetchFalso = respostaFalsa(200, {})
    vi.stubGlobal('fetch', fetchFalso)

    await api('/produtos?page=0')

    expect(fetchFalso.mock.calls[0][0]).toBe('http://localhost:8080/produtos?page=0')
  })

  it('converte o erro da API em ApiError com status, mensagem e detalhes', async () => {
    vi.stubGlobal(
      'fetch',
      respostaFalsa(422, {
        timestamp: '2026-11-09T21:00:00Z',
        status: 422,
        erro: 'Unprocessable Content',
        mensagem: "Estoque insuficiente para o produto 'Teclado'",
        caminho: '/pedidos',
        detalhes: ['itens[0]: sem estoque'],
      }),
    )

    const erro = await api('/pedidos').catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({
      status: 422,
      message: "Estoque insuficiente para o produto 'Teclado'",
      detalhes: ['itens[0]: sem estoque'],
    })
  })

  it('usa uma mensagem genérica quando o erro vem sem corpo JSON', async () => {
    vi.stubGlobal('fetch', respostaFalsa(403))

    const erro = await api('/clientes').catch((e: unknown) => e)

    expect(erro).toMatchObject({ status: 403, message: 'Erro 403 ao chamar a API', detalhes: [] })
  })

  it('transforma falha de rede (API desligada) em ApiError com status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const erro = await api('/produtos').catch((e: unknown) => e)

    expect(erro).toMatchObject({ status: 0, message: 'Não foi possível conectar à API' })
  })

  it('envia o token no cabeçalho Authorization quando existe', async () => {
    const fetchFalso = respostaFalsa(200, {})
    vi.stubGlobal('fetch', fetchFalso)
    setTokenProvider(() => 'abc')

    await api('/auth/me')

    const headers = new Headers(fetchFalso.mock.calls[0][1].headers)
    expect(headers.get('Authorization')).toBe('Bearer abc')
  })

  it('não envia Authorization quando não há token', async () => {
    const fetchFalso = respostaFalsa(200, {})
    vi.stubGlobal('fetch', fetchFalso)

    await api('/produtos')

    const headers = new Headers(fetchFalso.mock.calls[0][1].headers)
    expect(headers.has('Authorization')).toBe(false)
  })

  it('avisa quando a API responde 401 (token inválido ou expirado)', async () => {
    vi.stubGlobal('fetch', respostaFalsa(401, { status: 401, mensagem: 'Token expirado', detalhes: [] }))
    const aoDesautorizar = vi.fn()
    setOnUnauthorized(aoDesautorizar)

    await api('/pedidos').catch(() => {})

    expect(aoDesautorizar).toHaveBeenCalledOnce()
  })

  it('envia corpo JSON com Content-Type', async () => {
    const fetchFalso = respostaFalsa(201, { id: 5 })
    vi.stubGlobal('fetch', fetchFalso)

    await api('/pedidos', { method: 'POST', body: JSON.stringify({ itens: [] }) })

    const headers = new Headers(fetchFalso.mock.calls[0][1].headers)
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('devolve undefined em 204 No Content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    await expect(api('/produtos/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })
})

describe('deveTentarDeNovo()', () => {
  it('não repete erros 4xx: a resposta seria a mesma', () => {
    expect(deveTentarDeNovo(0, new ApiError(404, 'Produto não encontrado'))).toBe(false)
    expect(deveTentarDeNovo(0, new ApiError(401, 'Token expirado'))).toBe(false)
  })

  it('repete uma vez falhas de rede e erros 5xx', () => {
    expect(deveTentarDeNovo(0, new ApiError(0, 'Não foi possível conectar à API'))).toBe(true)
    expect(deveTentarDeNovo(0, new ApiError(503, 'Indisponível'))).toBe(true)
    expect(deveTentarDeNovo(1, new ApiError(503, 'Indisponível'))).toBe(false)
  })
})
