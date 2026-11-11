import { describe, expect, it } from 'vitest'
import { lerInteiroPositivo } from './numeros'

describe('lerInteiroPositivo', () => {
  it('aceita inteiros positivos escritos só com dígitos', () => {
    expect(lerInteiroPositivo('1')).toBe(1)
    expect(lerInteiroPositivo('42')).toBe(42)
  })

  it.each([null, '', 'abc', '0', '-3', '1.5', '1e10', ' 2', '99999999999999999999'])(
    'rejeita %j',
    (texto) => {
      expect(lerInteiroPositivo(texto)).toBeNull()
    },
  )
})
