import { type Query, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { buscarUsuarioLogado, entrar, registrar } from '../api/auth'
import { setOnUnauthorized, setTokenProvider } from '../api/client'
import { AuthContext, type ValorAuth } from './contexto'
import {
  adotarTokenDeOutraAba,
  apagarToken,
  CHAVE_TOKEN,
  carregarTokenSalvo,
  obterToken,
  salvarToken,
} from './token'

/** Chave do cache do usuário logado. O token entra na chave: token novo = busca nova. */
const chaveUsuario = (token: string | null) => ['auth', 'me', token] as const

/** A vitrine é pública; todo o resto do cache (usuário, pedidos...) pertence a quem está logado. */
const ehDadoPrivado = (query: Query) => query.queryKey[0] !== 'produtos'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const [token, setToken] = useState(() => {
    // Registra a fonte do token no client HTTP já na primeira renderização, antes de qualquer
    // componente filho fazer chamadas. Os efeitos dos filhos rodam ANTES do useEffect do pai,
    // então registrar num useEffect aqui chegaria tarde para a primeira chamada.
    setTokenProvider(obterToken)
    return carregarTokenSalvo()
  })

  const encerrarSessao = useCallback(() => {
    apagarToken()
    setToken(null)
    queryClient.removeQueries({ predicate: ehDadoPrivado })
  }, [queryClient])

  // Um 401 encerra a sessão, mas só se foi o token ATUAL que a API recusou.
  // Uma resposta atrasada de um token antigo (ex.: login feito no meio do caminho) é ignorada.
  useEffect(() => {
    setOnUnauthorized((tokenUsado) => {
      if (tokenUsado === obterToken()) encerrarSessao()
    })
    return () => setOnUnauthorized(() => {})
  }, [encerrarSessao])

  // Login ou logout em OUTRA aba: o navegador avisa pelo evento "storage"
  useEffect(() => {
    function aoMudarEmOutraAba(evento: StorageEvent) {
      if (evento.key !== CHAVE_TOKEN && evento.key !== null) return // key null = localStorage.clear()
      const novo = evento.key === null ? null : evento.newValue
      adotarTokenDeOutraAba(novo)
      queryClient.removeQueries({ predicate: ehDadoPrivado })
      setToken(novo)
    }
    window.addEventListener('storage', aoMudarEmOutraAba)
    return () => window.removeEventListener('storage', aoMudarEmOutraAba)
  }, [queryClient])

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
        encerrarSessao()
        throw erro
      }
      setToken(novoToken)
      // Troca de usuário: descarta o que era da sessão anterior, mantendo o usuário novo
      queryClient.removeQueries({
        predicate: (q) => ehDadoPrivado(q) && q.queryKey[2] !== novoToken,
      })
    },
    [queryClient, encerrarSessao],
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
