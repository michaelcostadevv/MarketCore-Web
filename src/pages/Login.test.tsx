import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { UsuarioLogado } from '../api/types'
import { renderizarComProvedores, rotasFalsas } from '../test/renderizar'
import { Login } from './Login'

const maria: UsuarioLogado = {
  id: 3,
  email: 'maria@exemplo.com',
  role: 'ROLE_USER',
  admin: false,
  clienteId: 10,
  nome: 'Maria',
}
const loginOk = rotasFalsas({ 'POST /auth/login': [200, { token: 't' }], 'GET /auth/me': [200, maria] })

function renderizarLogin(rota = '/login') {
  return renderizarComProvedores(
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<p>página: vitrine</p>} />
      <Route path="/pedidos" element={<p>página: pedidos</p>} />
    </Routes>,
    { rota },
  )
}

async function preencherEEntrar() {
  await userEvent.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com')
  await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('Login', () => {
  it('mostra a mensagem da API quando e-mail ou senha estão errados', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        rotasFalsas({
          'POST /auth/login': [401, { status: 401, mensagem: 'E-mail ou senha inválidos', detalhes: [] }],
        }),
      ),
    )
    renderizarLogin()

    await preencherEEntrar()

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos')
  })

  it('depois de um erro, leva o foco para a mensagem e liga os campos a ela', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        rotasFalsas({
          'POST /auth/login': [401, { status: 401, mensagem: 'E-mail ou senha inválidos', detalhes: [] }],
        }),
      ),
    )
    renderizarLogin()

    await preencherEEntrar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveFocus() // quem usa teclado não volta para o topo da página
    expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('E-mail ou senha inválidos')
    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription('E-mail ou senha inválidos')
  })

  it('envia e-mail e senha no formato da API e vai para a vitrine', async () => {
    const fetchFalso = vi.fn(loginOk)
    vi.stubGlobal('fetch', fetchFalso)
    renderizarLogin()

    await preencherEEntrar()

    expect(await screen.findByText('página: vitrine')).toBeInTheDocument()
    expect(JSON.parse(String(fetchFalso.mock.calls[0][1]?.body))).toEqual({
      email: 'maria@exemplo.com',
      password: 'senha-forte',
    })
  })

  it('depois do login volta para a página pedida em ?voltar=', async () => {
    vi.stubGlobal('fetch', vi.fn(loginOk))
    renderizarLogin('/login?voltar=%2Fpedidos')

    await preencherEEntrar()

    expect(await screen.findByText('página: pedidos')).toBeInTheDocument()
  })

  it('enquanto confirma um token salvo, mostra "Carregando…" em vez do formulário', () => {
    localStorage.setItem('marketcore.token', 't')
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {}))) // /auth/me nunca responde
    renderizarLogin()

    expect(screen.getByRole('status')).toHaveTextContent('Carregando…')
    expect(screen.queryByRole('button', { name: 'Entrar' })).not.toBeInTheDocument()
  })

  it('ignora ?voltar= que aponta para outro site', async () => {
    vi.stubGlobal('fetch', vi.fn(loginOk))
    renderizarLogin('/login?voltar=%2F%2Fsite-malicioso.com')

    await preencherEEntrar()

    expect(await screen.findByText('página: vitrine')).toBeInTheDocument()
  })
})
