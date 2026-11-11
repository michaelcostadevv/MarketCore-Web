import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { comTokenSalvo, maria } from '../test/dados'
import { renderizarComProvedores, rotasFalsas } from '../test/renderizar'
import { Layout } from './Layout'

function renderizarLayout() {
  return renderizarComProvedores(
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<p>conteúdo</p>} />
      </Route>
    </Routes>,
  )
}

describe('Layout', () => {
  it('o menu da conta tem nome para leitores de tela (visitante)', () => {
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))

    renderizarLayout()

    const menu = screen.getByRole('navigation', { name: 'Conta' })
    expect(menu).toHaveTextContent('Entrar')
  })

  it('logado: menu "Conta" com o nome, e o title mostra nome e e-mail', async () => {
    comTokenSalvo()
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({ 'GET /auth/me': [200, maria] })))

    renderizarLayout()

    const menu = await screen.findByRole('navigation', { name: 'Conta' })
    expect(menu).toHaveTextContent('Sair')
    expect(screen.getByTitle('Maria (maria@exemplo.com)')).toBeInTheDocument()
  })

  it('tem um link para pular direto ao conteúdo (atalho para quem usa teclado)', () => {
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))

    renderizarLayout()

    expect(screen.getAllByRole('link')[0]).toHaveTextContent('Pular para o conteúdo')
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo')
  })
})
