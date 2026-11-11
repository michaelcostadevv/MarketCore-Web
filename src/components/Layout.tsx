import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { useCarrinho } from '../carrinho/useCarrinho'
import { LimiteDeErro } from './LimiteDeErro'

/** Estrutura comum a todas as páginas: cabeçalho, conteúdo (Outlet) e rodapé. */
export function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-bold tracking-tight text-slate-900">
            Market<span className="text-indigo-600">Core</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <LinkCarrinho />
            <MenuUsuario />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {/* key: ao mudar de página o limite "zera" e a nova página tenta renderizar normalmente */}
        <LimiteDeErro key={pathname}>
          <Outlet />
        </LimiteDeErro>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        MarketCore · projeto de estudo
      </footer>
    </div>
  )
}

/** Ícone do carrinho com a quantidade de itens. */
function LinkCarrinho() {
  const { quantidadeItens } = useCarrinho()
  return (
    <Link
      to="/carrinho"
      aria-label={`Carrinho, ${quantidadeItens} ${quantidadeItens === 1 ? 'item' : 'itens'}`}
      className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" />
        <circle cx="9.5" cy="20" r="1.2" />
        <circle cx="17.5" cy="20" r="1.2" />
      </svg>
      {quantidadeItens > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-semibold text-white">
          {quantidadeItens > 99 ? '99+' : quantidadeItens}
        </span>
      )}
    </Link>
  )
}

/** Lado direito do cabeçalho: "Entrar" para visitantes, nome + "Sair" para quem está logado. */
function MenuUsuario() {
  const { usuario, carregando, logout } = useAuth()
  const navigate = useNavigate()

  if (carregando) return null // evita "piscar" o botão Entrar enquanto confirma o token salvo

  if (!usuario) {
    return (
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/login" className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
          Entrar
        </Link>
        <Link
          to="/cadastro"
          className="hidden rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700 sm:block"
        >
          Criar conta
        </Link>
      </nav>
    )
  }

  function sair() {
    logout()
    navigate('/')
  }

  return (
    <nav className="flex items-center gap-1 text-sm sm:gap-3">
      <Link to="/pedidos" className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
        <span className="sm:hidden">Pedidos</span>
        <span className="hidden sm:inline">Meus pedidos</span>
      </Link>
      {/* No celular o espaço é curto: a saudação só aparece em telas maiores */}
      <span className="hidden max-w-xs truncate text-slate-600 md:inline" title={usuario.email}>
        Olá, <span className="font-medium text-slate-900">{usuario.nome ?? usuario.email}</span>
      </span>
      {usuario.admin && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">admin</span>
      )}
      <button
        type="button"
        onClick={sair}
        className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100"
      >
        Sair
      </button>
    </nav>
  )
}
