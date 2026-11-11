import { describe, expect, it } from 'vitest'
import { destinoSeguro } from './destino'

describe('destinoSeguro', () => {
  it('aceita caminhos internos do site', () => {
    expect(destinoSeguro('/pedidos')).toBe('/pedidos')
    expect(destinoSeguro('/produtos/7?x=1')).toBe('/produtos/7?x=1')
    expect(destinoSeguro('/pedidos#topo')).toBe('/pedidos#topo')
  })

  it.each([
    null,
    '',
    'pedidos',
    'https://site-malicioso.com',
    'javascript:alert(1)',
    '//site-malicioso.com',
    '/\\site-malicioso.com',
    // O navegador remove TAB e quebras de linha de URLs: "/<TAB>/evil.com" vira "//evil.com"
    '/\t/site-malicioso.com',
    '/\n/site-malicioso.com',
    '/\r/site-malicioso.com',
    '/pedidos\u0000',
  ])('troca %j pela vitrine (evita open redirect)', (voltar) => {
    expect(destinoSeguro(voltar)).toBe('/')
  })
})
