import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LimiteDeErro } from './LimiteDeErro'

function Quebra(): never {
  throw new Error('bug inesperado')
}

describe('LimiteDeErro', () => {
  it('mostra uma mensagem em vez de deixar a tela em branco quando um componente quebra', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}) // o React registra o erro no console

    render(
      <LimiteDeErro>
        <Quebra />
      </LimiteDeErro>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado ao exibir esta página')
  })
})
