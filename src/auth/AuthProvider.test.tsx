import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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

/** Componente de teste que mostra o estado do useAuth e tem botões para as ações. */
function Painel() {
  const { usuario, carregando, login, logout } = useAuth()
  if (carregando) return <p>carregando</p>
  return (
    <div>
      <p>{usuario ? `logado: ${usuario.nome}` : 'deslogado'}</p>
      <button onClick={() => login('maria@exemplo.com', 'senha-forte').catch(() => {})}>entrar</button>
      <button onClick={logout}>sair</button>
    </div>
  )
}

describe('AuthProvider', () => {
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
    expect(new Headers(chamadaMe?.[1]?.headers).get('Authorization')).toBe('Bearer tok-123')
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

  it('logout apaga o token e o usuário', async () => {
    localStorage.setItem(CHAVE_TOKEN, 'tok-salvo')
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ 'GET /auth/me': [200, maria] })))
    renderizarComProvedores(<Painel />)
    await screen.findByText('logado: Maria')

    await userEvent.click(screen.getByRole('button', { name: 'sair' }))

    expect(screen.getByText('deslogado')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
  })

  it('login com senha errada não salva token e mantém deslogado', async () => {
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ 'POST /auth/login': [401, erro401] })))
    renderizarComProvedores(<Painel />)

    await userEvent.click(screen.getByRole('button', { name: 'entrar' }))

    expect(screen.getByText('deslogado')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_TOKEN)).toBeNull()
  })
})
