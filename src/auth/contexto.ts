import { createContext } from 'react'
import type { UsuarioLogado } from '../api/types'

export type ValorAuth = {
  /** Quem está logado (GET /auth/me), ou null. */
  usuario: UsuarioLogado | null
  /** true enquanto confirmamos com a API um token salvo de uma visita anterior. */
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>
  logout: () => void
}

/**
 * Context: deixa o estado de login disponível para qualquer componente da árvore,
 * sem passar props de pai para filho. Fica num arquivo separado do Provider e do hook
 * para o "Fast Refresh" do Vite funcionar (arquivos de componente só exportam componentes).
 */
export const AuthContext = createContext<ValorAuth | null>(null)
