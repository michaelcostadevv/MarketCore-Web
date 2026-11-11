import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { renderizarComProvedores } from '../test/renderizar'
import { ProdutoDetalhe } from './ProdutoDetalhe'

describe('ProdutoDetalhe', () => {
  it.each(['abc', '1e30', '0'])('/produtos/%s mostra 404 sem chamar a API', (id) => {
    const fetchFalso = vi.fn()
    vi.stubGlobal('fetch', fetchFalso)

    renderizarComProvedores(
      <Routes>
        <Route path="/produtos/:id" element={<ProdutoDetalhe />} />
      </Routes>,
      { rota: `/produtos/${id}` },
    )

    expect(screen.getByText('Produto não encontrado')).toBeInTheDocument()
    expect(fetchFalso).not.toHaveBeenCalled()
  })
})
