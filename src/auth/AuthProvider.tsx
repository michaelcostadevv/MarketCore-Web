import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { buscarUsuarioLogado, entrar, registrar } from '../api/auth'
import { setOnUnauthorized, setTokenProvider } from '../api/client'
import { AuthContext, type ValorAuth } from './contexto'
import { apagarToken, lerToken, salvarToken } from './token'

/** Chave do cache do usuário logado. O token entra na chave: token novo = busca nova. */
const chaveUsuario = (token: string | null) => ['auth', 'me', token] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const [token, setToken] = useState(() => {
    // Registra a fonte do token no client HTTP já na primeira renderização, antes de qualquer
    // componente filho fazer chamadas. Os efeitos dos filhos rodam ANTES do useEffect do pai,
    // então registrar num useEffect aqui chegaria tarde para a primeira chamada.
    setTokenProvider(lerToken)
    return lerToken()
  })

  const encerrarSessao = useCallback(() => {
    apagarToken()
    setToken(null)
    queryClient.removeQueries({ queryKey: ['auth'] })
  }, [queryClient])

  // Qualquer 401 da API (token vencido ou inválido) encerra a sessão
  useEffect(() => {
    setOnUnauthorized(encerrarSessao)
    return () => setOnUnauthorized(() => {})
  }, [encerrarSessao])

  const { data: usuario, isPending } = useQuery({
    queryKey: chaveUsuario(token),
    queryFn: buscarUsuarioLogado,
    enabled: token !== null, // sem token, nem chama a API
    staleTime: Infinity, // o usuário só muda no login/logout
  })

  /** Guarda o token e só conclui depois de saber quem é o usuário (o cabeçalho já aparece certo). */
  const iniciarSessao = useCallback(
    async (novoToken: string) => {
      salvarToken(novoToken)
      try {
        await queryClient.fetchQuery({
          queryKey: chaveUsuario(novoToken),
          queryFn: buscarUsuarioLogado,
          staleTime: Infinity,
        })
      } catch (erro) {
        apagarToken()
        throw erro
      }
      setToken(novoToken)
    },
    [queryClient],
  )

  const valor = useMemo<ValorAuth>(
    () => ({
      usuario: token ? (usuario ?? null) : null,
      carregando: token !== null && isPending,
      login: async (email, senha) => iniciarSessao((await entrar(email, senha)).token),
      cadastrar: async (nome, email, senha) => iniciarSessao((await registrar(nome, email, senha)).token),
      logout: encerrarSessao,
    }),
    [token, usuario, isPending, iniciarSessao, encerrarSessao],
  )

  return <AuthContext value={valor}>{children}</AuthContext>
}
