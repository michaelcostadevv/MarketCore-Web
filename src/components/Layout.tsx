import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
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
          <MenuUsuario />
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
    <nav className="flex items-center gap-3 text-sm">
      <span className="max-w-[10rem] truncate text-slate-600 sm:max-w-xs" title={usuario.email}>
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
