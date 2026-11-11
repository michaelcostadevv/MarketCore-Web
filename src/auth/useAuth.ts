import { useContext } from 'react'
import { AuthContext } from './contexto'

/** Acesso ao login em qualquer componente: const { usuario, login, logout } = useAuth() */
export function useAuth() {
  const valor = useContext(AuthContext)
  if (!valor) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return valor
}
