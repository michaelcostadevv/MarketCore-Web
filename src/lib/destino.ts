/**
 * Valida o ?voltar= do login antes de navegar para ele.
 *
 * Sem isso, um link como /login?voltar=//site-malicioso.com levaria o usuário para fora
 * do site logo depois de digitar a senha ("open redirect"). Só aceitamos caminhos internos:
 * começam com "/", mas não com "//" nem "/\" (que o navegador também trata como outro site).
 */
export function destinoSeguro(voltar: string | null | undefined): string {
  if (!voltar || !voltar.startsWith('/') || voltar.startsWith('//') || voltar.startsWith('/\\')) {
    return '/'
  }
  return voltar
}
