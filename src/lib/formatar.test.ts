import { describe, expect, it } from 'vitest'
import { formatarData, formatarPreco } from './formatar'

describe('formatarPreco', () => {
  it('formata em reais no padrão brasileiro', () => {
    expect(formatarPreco(1234.5)).toMatch(/^R\$\s1\.234,50$/)
  })
})

describe('formatarData', () => {
  it('formata a data do pedido (LocalDateTime da API) como dd/mm/aaaa hh:mm', () => {
    expect(formatarData('2026-11-09T21:05:00')).toBe('09/11/2026, 21:05')
  })
})
