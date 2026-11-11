// Origem fictícia só para o navegador resolver o caminho e nos dizer onde ele levaria.
const ORIGEM_BASE = 'http://destino.invalid'

/**
 * Valida o ?voltar= do login antes de navegar para ele.
 *
 * Sem isso, um link como /login?voltar=//site-malicioso.com levaria o usuário para fora
 * do site logo depois de digitar a senha ("open redirect"). Checar só o começo do texto
 * não basta: o navegador apaga TAB e quebras de linha de URLs, então "/<TAB>/evil.com"
 * vira "//evil.com". Por isso:
 * 1. recusamos caracteres de controle e barra invertida em qualquer posição;
 * 2. deixamos o próprio parser de URL resolver o caminho e exigimos que continue no site.
 */
export function destinoSeguro(voltar: string | null | undefined): string {
  // Os caracteres de controle na regex são intencionais: é justamente o que queremos recusar
  // oxlint-disable-next-line no-control-regex
  if (!voltar || !voltar.startsWith('/') || /[\u0000-\u001F\u007F\\]/.test(voltar)) return '/'

  let url: URL
  try {
    url = new URL(voltar, ORIGEM_BASE)
  } catch {
    return '/'
  }
  if (url.origin !== ORIGEM_BASE) return '/'
  return url.pathname + url.search + url.hash
}
