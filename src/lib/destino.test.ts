import { describe, expect, it } from 'vitest'
import { destinoSeguro } from './destino'

describe('destinoSeguro', () => {
  it('aceita caminhos internos do site', () => {
    expect(destinoSeguro('/pedidos')).toBe('/pedidos')
    expect(destinoSeguro('/produtos/7?x=1')).toBe('/produtos/7?x=1')
  })

  it.each([null, '', 'https://site-malicioso.com', '//site-malicioso.com', '/\\site-malicioso.com', 'pedidos'])(
    'troca %j pela vitrine (evita open redirect)',
    (voltar) => {
      expect(destinoSeguro(voltar)).toBe('/')
    },
  )
})
