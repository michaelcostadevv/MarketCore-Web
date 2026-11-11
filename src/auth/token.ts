// Onde o token JWT fica guardado entre recarregamentos da página.
// try/catch: o localStorage pode lançar erro (modo anônimo de alguns navegadores, cota cheia,
// armazenamento bloqueado). Nesses casos o login funciona só até o próximo F5, sem quebrar o site.

export const CHAVE_TOKEN = 'marketcore.token'

export function lerToken(): string | null {
  try {
    return localStorage.getItem(CHAVE_TOKEN)
  } catch {
    return null
  }
}

export function salvarToken(token: string) {
  try {
    localStorage.setItem(CHAVE_TOKEN, token)
  } catch {
    // sem armazenamento: o token vale só nesta aba até o F5
  }
}

export function apagarToken() {
  try {
    localStorage.removeItem(CHAVE_TOKEN)
  } catch {
    // nada a apagar
  }
}
