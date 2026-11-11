// Onde o token JWT fica.
//
// A fonte da verdade é a variável em memória "tokenAtual": é ela que o client HTTP usa.
// O localStorage é só a cópia que sobrevive ao F5. Assim, se o navegador bloquear o
// armazenamento (modo anônimo de alguns navegadores, cota cheia), o login continua
// funcionando normalmente até a página ser recarregada.

export const CHAVE_TOKEN = 'marketcore.token'

let tokenAtual: string | null = null

/** Token usado nas chamadas à API agora. */
export function obterToken(): string | null {
  return tokenAtual
}

/** Lê a cópia salva (visita anterior) e passa a usá-la. Chamado quando o app inicia. */
export function carregarTokenSalvo(): string | null {
  try {
    tokenAtual = localStorage.getItem(CHAVE_TOKEN)
  } catch {
    tokenAtual = null
  }
  return tokenAtual
}

export function salvarToken(token: string) {
  tokenAtual = token
  try {
    localStorage.setItem(CHAVE_TOKEN, token)
  } catch {
    // sem armazenamento: o token vale só em memória, até o F5
  }
}

export function apagarToken() {
  tokenAtual = null
  try {
    localStorage.removeItem(CHAVE_TOKEN)
  } catch {
    // nada a apagar
  }
}

/** Outra aba entrou ou saiu: adota o token dela sem mexer no armazenamento (ela já mexeu). */
export function adotarTokenDeOutraAba(token: string | null) {
  tokenAtual = token
}
