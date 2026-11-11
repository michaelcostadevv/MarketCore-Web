import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { UsuarioLogado } from '../api/types'
import { renderizarComProvedores, rotasFalsas } from '../test/renderizar'
import { CHAVE_TOKEN } from './token'
import { useAuth } from './useAuth'

const maria: UsuarioLogado = {
  id: 3,
  email: 'maria@exemplo.com',
  role: 'ROLE_USER',
  admin: false,
  clienteId: 10,
  nome: 'Maria',
}

const erro401 = { status: 401, mensagem: 'E-mail ou senha inválidos', detalhes: [] }

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function tokenEnviado(init?: RequestInit) {
  return new Headers(init?.headers).get('Authorization')
}

/** Componente de teste que mostra o estado do useAuth e tem botões para as ações. */
function Painel() {
  const { usuario, carregando, login, logout } = useAuth()
  return (
    <div>
      <p>{carregando ? 'carregando' : usuario ? `logado: ${usuario.nome}` : 'deslogado'}</p>
      <button onClick={() => login('maria@exemplo.com', 'senha-forte').catch(() => {})}>entrar</button>
      <button onClick={logout}>sair</button>
    </div>
  )
}

describe('AuthProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('começa deslogado quando não há token salvo, sem chamar /auth/me', () => {
    const fetchFalso = vi.fn(rotasFalsas({}))
    vi.stubGlobal('fetch', fetchFalso)

    renderizarComProvedores(<Painel />)

    expect(screen.getByText('deslogado')).toBeInTheDocument()
    expect(fetchFalso).not.toHaveBeenCalled()
  })

  it('login salva o token e carrega o usuário de /auth/me', async () => {
    const fetchFalso = vi.fn(
      rotasFalsas({ 'POST /auth/login': [200, { token: 'tok-123' }], 'GET /auth/me': [200, maria] }),
    )
    vi.stubGlobal('fetch', fetchFalso)
    renderizarComProvedores(<Painel />)

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }))

    expect(await screen.findByText('logado: Maria')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBe('tok-123')
    const chamadaMe = fetchFalso.mock.calls.find(([url]) => String(url).endsWith('/auth/me'))
    expect(tokenEnviado(chamadaMe?.[1])).toBe('Bearer tok-123')
  })

  it('restaura a sessão a partir do token salvo (sobrevive ao F5)', async () => {
    localStorage.setItem(CHAVE_TOKEN, 'tok-salvo')
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ 'GET /auth/me': [200, maria] })))

    renderizarComProvedores(<Painel />)

    expect(screen.getByText('carregando')).toBeInTheDocument()
    expect(await screen.findByText('logado: Maria')).toBeInTheDocument()
  })

  it('token salvo vencido (401 em /auth/me) é apagado e o usuário fica deslogado', async () => {
    localStorage.setItem(CHAVE_TOKEN, 'tok-vencido')
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ 'GET /auth/me': [401, { ...erro401, mensagem: 'Token expirado' }] })))

    renderizarComProvedores(<Painel />)

    expect(await screen.findByText('deslogado')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
  })

  it('logout apaga o token, o usuário e os dados privados do cache (mas mantém a vitrine)', async () => {
    localStorage.setItem(CHAVE_TOKEN, 'tok-salvo')
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ 'GET /auth/me': [200, maria] })))
    const { queryClient } = renderizarComProvedores(<Painel />)
    await screen.findByText('logado: Maria')
    queryClient.setQueryData(['pedidos'], ['pedido da Maria'])
    queryClient.setQueryData(['produtos', 1], { id: 1 })

    await userEvent.click(screen.getByRole('button', { name: 'sair' }))

    expect(screen.getByText('deslogado')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
    expect(queryClient.getQueryData(['pedidos'])).toBeUndefined()
    expect(queryClient.getQueryData(['produtos', 1])).toEqual({ id: 1 })
  })

  it('login com senha errada não salva token e mantém deslogado', async () => {
    const fetchFalso = vi.fn(rotasFalsas({ 'POST /auth/login': [401, erro401] }))
    vi.stubGlobal('fetch', fetchFalso)
    renderizarComProvedores(<Painel />)

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }))

    await waitFor(() => expect(fetchFalso).toHaveBeenCalledOnce())
    expect(screen.getByText('deslogado')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
  })

  it('login com senha errada não derruba a sessão de quem já está logado', async () => {
    localStorage.setItem(CHAVE_TOKEN, 'tok-salvo')
    const fetchFalso = vi.fn(rotasFalsas({ 'GET /auth/me': [200, maria], 'POST /auth/login': [401, erro401] }))
    vi.stubGlobal('fetch', fetchFalso)
    renderizarComProvedores(<Painel />)
    await screen.findByText('logado: Maria')

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }))

    await waitFor(() => expect(fetchFalso).toHaveBeenCalledTimes(2))
    expect(tokenEnviado(fetchFalso.mock.calls[1][1])).toBeNull() // login não envia o token atual
    expect(screen.getByText('logado: Maria')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBe('tok-salvo')
  })

  it('um 401 atrasado do token antigo não apaga a sessão nova', async () => {
    localStorage.setItem(CHAVE_TOKEN, 'tok-velho')
    let responderVelho: (r: Response) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((url, init) => {
        const caminho = new URL(String(url)).pathname
        if (caminho === '/auth/login') return Promise.resolve(json(200, { token: 'tok-novo' }))
        if (tokenEnviado(init) === 'Bearer tok-velho') {
          return new Promise<Response>((resolver) => (responderVelho = resolver)) // fica pendurado
        }
        return Promise.resolve(json(200, maria))
      }),
    )
    renderizarComProvedores(<Painel />)
    expect(screen.getByText('carregando')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }))
    expect(await screen.findByText('logado: Maria')).toBeInTheDocument()

    await act(async () => responderVelho(json(401, { ...erro401, mensagem: 'Token expirado' })))

    expect(screen.getByText('logado: Maria')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBe('tok-novo')
  })

  it('funciona mesmo com o localStorage bloqueado (sessão vale até o F5)', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError')
    })
    const fetchFalso = vi.fn(
      rotasFalsas({ 'POST /auth/login': [200, { token: 'tok-123' }], 'GET /auth/me': [200, maria] }),
    )
    vi.stubGlobal('fetch', fetchFalso)
    renderizarComProvedores(<Painel />)

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }))

    expect(await screen.findByText('logado: Maria')).toBeInTheDocument()
    const chamadaMe = fetchFalso.mock.calls.find(([url]) => String(url).endsWith('/auth/me'))
    expect(tokenEnviado(chamadaMe?.[1])).toBe('Bearer tok-123')
  })

  it('logout feito em outra aba desloga esta aba também', async () => {
    localStorage.setItem(CHAVE_TOKEN, 'tok-salvo')
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ 'GET /auth/me': [200, maria] })))
    renderizarComProvedores(<Painel />)
    await screen.findByText('logado: Maria')

    localStorage.removeItem(CHAVE_TOKEN)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CHAVE_TOKEN, newValue: null }))
    })

    expect(screen.getByText('deslogado')).toBeInTheDocument()
  })
})
