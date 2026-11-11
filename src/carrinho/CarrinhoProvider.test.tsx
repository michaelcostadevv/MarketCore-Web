import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { comCarrinhoSalvo, mouse, teclado } from '../test/dados'
import { renderizarComProvedores, rotasFalsas } from '../test/renderizar'
import { CHAVE_CARRINHO } from './armazenamento'
import { useCarrinho } from './useCarrinho'

function Painel() {
  const { itens, quantidadeItens, total, adicionar, limpar } = useCarrinho()
  return (
    <div>
      <p>
        {quantidadeItens} itens · total {total} · {itens.map((i) => i.produto.nome).join(',')}
      </p>
      <button onClick={() => adicionar(mouse, 2)}>adicionar mouse</button>
      <button onClick={limpar}>limpar</button>
    </div>
  )
}

describe('CarrinhoProvider', () => {
  it('restaura o carrinho salvo numa visita anterior', () => {
    comCarrinhoSalvo([{ produto: teclado, quantidade: 2 }])
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))

    renderizarComProvedores(<Painel />)

    expect(screen.getByText('2 itens · total 399.8 · Teclado')).toBeInTheDocument()
  })

  it('salva as mudanças no localStorage', async () => {
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))
    renderizarComProvedores(<Painel />)

    await userEvent.click(screen.getByRole('button', { name: 'adicionar mouse' }))

    expect(screen.getByText('2 itens · total 100 · Mouse')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(CHAVE_CARRINHO) ?? '[]')).toEqual([{ produto: mouse, quantidade: 2 }])
  })

  it.each([
    ['JSON quebrado', '{não é json'],
    ['formato errado', '{"produto": 1}'],
    ['item sem produto', '[{"quantidade": 2}]'],
  ])('ignora um carrinho salvo inválido (%s) em vez de quebrar a página', (_caso, salvo) => {
    // (um item inválido não derruba os outros: ver o teste abaixo)
    localStorage.setItem(CHAVE_CARRINHO, salvo)
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))

    renderizarComProvedores(<Painel />)

    expect(screen.getByText('0 itens · total 0 ·')).toBeInTheDocument()
  })

  it('descarta só os itens inválidos, mantendo os bons', () => {
    localStorage.setItem(
      CHAVE_CARRINHO,
      JSON.stringify([
        { produto: teclado, quantidade: 2 },
        { produto: { ...mouse, preco: -5 }, quantidade: 1 },
        { produto: mouse, quantidade: 0 },
      ]),
    )
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))

    renderizarComProvedores(<Painel />)

    expect(screen.getByText('2 itens · total 399.8 · Teclado')).toBeInTheDocument()
  })

  it('limpar esvazia o carrinho', async () => {
    comCarrinhoSalvo([{ produto: teclado, quantidade: 2 }])
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))
    renderizarComProvedores(<Painel />)

    await userEvent.click(screen.getByRole('button', { name: 'limpar' }))

    expect(screen.getByText('0 itens · total 0 ·')).toBeInTheDocument()
  })

  it('acompanha mudanças feitas em outra aba', () => {
    vi.stubGlobal('fetch', vi.fn(rotasFalsas({})))
    renderizarComProvedores(<Painel />)

    const novo = JSON.stringify([{ produto: teclado, quantidade: 1 }])
    localStorage.setItem(CHAVE_CARRINHO, novo)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CHAVE_CARRINHO, newValue: novo }))
    })

    expect(screen.getByText('1 itens · total 199.9 · Teclado')).toBeInTheDocument()
  })
})
