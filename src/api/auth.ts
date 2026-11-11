import { api } from './client'
import type { UsuarioLogado } from './types'

/** Resposta de /auth/login e /auth/register (AuthResponse na API). */
type RespostaToken = { token: string }

export function entrar(email: string, senha: string) {
  return api<RespostaToken>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: senha }),
  })
}

/** Cria o login e o cadastro de cliente; a API já devolve o token (a pessoa entra logada). */
export function registrar(nome: string, email: string, senha: string) {
  return api<RespostaToken>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nome, email, password: senha }),
  })
}

export function buscarUsuarioLogado() {
  return api<UsuarioLogado>('/auth/me')
}
