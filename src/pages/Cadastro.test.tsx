import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { UsuarioLogado } from '../api/types'
import { renderizarComProvedores, rotasFalsas } from '../test/renderizar'
import { Cadastro } from './Cadastro'

const maria: UsuarioLogado = {
  id: 3,
  email: 'maria@exemplo.com',
  role: 'ROLE_USER',
  admin: false,
  clienteId: 10,
  nome: 'Maria',
}

function renderizarCadastro() {
  return renderizarComProvedores(
    <Routes>
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/" element={<p>página: vitrine</p>} />
    </Routes>,
    { rota: '/cadastro' },
  )
}

async function preencherECriar() {
  await userEvent.type(screen.getByLabelText('Nome'), 'Maria')
  await userEvent.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com')
  await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte')
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
}

describe('Cadastro', () => {
  it('cria a conta, já entra logado e vai para a vitrine', async () => {
    const fetchFalso = vi.fn(
      rotasFalsas({ 'POST /auth/register': [201, { token: 't' }], 'GET /auth/me': [200, maria] }),
    )
    vi.stubGlobal('fetch', fetchFalso)
    renderizarCadastro()

    await preencherECriar()

    expect(await screen.findByText('página: vitrine')).toBeInTheDocument()
    expect(JSON.parse(String(fetchFalso.mock.calls[0][1]?.body))).toEqual({
      nome: 'Maria',
      email: 'maria@exemplo.com',
      password: 'senha-forte',
    })
  })

  it('mostra os erros de validação por campo que a API devolve (400)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        rotasFalsas({
          'POST /auth/register': [
            400,
            {
              status: 400,
              mensagem: 'Dados inválidos',
              detalhes: ['password: A senha deve ter entre 8 e 72 caracteres'],
            },
          ],
        }),
      ),
    )
    renderizarCadastro()

    await preencherECriar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Dados inválidos')
    expect(alerta).toHaveTextContent('password: A senha deve ter entre 8 e 72 caracteres')
    expect(alerta).toHaveFocus()
    // só o campo que a API recusou é marcado como inválido ("password" na API = campo Senha)
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nome')).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription(/Entre 8 e 72 caracteres.*Dados inválidos/)
  })

  it('mostra a mensagem de e-mail já cadastrado (409)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        rotasFalsas({ 'POST /auth/register': [409, { status: 409, mensagem: 'E-mail já cadastrado', detalhes: [] }] }),
      ),
    )
    renderizarCadastro()

    await preencherECriar()

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail já cadastrado')
  })
})
