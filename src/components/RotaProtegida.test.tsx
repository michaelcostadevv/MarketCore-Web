import { screen } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { CHAVE_TOKEN } from '../auth/token'
import { renderizarComProvedores, rotasFalsas } from '../test/renderizar'
import { RotaProtegida } from './RotaProtegida'

function MostraUrl() {
  const { pathname, search } = useLocation()
  return <p>url: {pathname + search}</p>
}

function renderizar(rota: string) {
  return renderizarComProvedores(
    <Routes>
      <Route element={<RotaProtegida />}>
        <Route path="/pedidos" element={<p>conteúdo protegido</p>} />
      </Route>
      <Route path="/login" element={<MostraUrl />} />
    </Routes>,
    { rota },
  )
}

describe('RotaProtegida', () => {
  it('manda para o login guardando a página pedida em ?voltar=', () => {
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))

    renderizar('/pedidos?status=PAGO')

    expect(screen.getByText('url: /login?voltar=%2Fpedidos%3Fstatus%3DPAGO')).toBeInTheDocument()
  })

  it('mostra o conteúdo quando há usuário logado', async () => {
    localStorage.setItem(CHAVE_TOKEN, 't')
    vi.stubGlobal(
      'fetch',
      vi.fn(
        rotasFalsas({
          'GET /auth/me': [200, { id: 1, email: 'a@b.c', role: 'ROLE_USER', admin: false, clienteId: 1, nome: 'A' }],
        }),
      ),
    )

    renderizar('/pedidos')

    expect(await screen.findByText('conteúdo protegido')).toBeInTheDocument()
  })
})
