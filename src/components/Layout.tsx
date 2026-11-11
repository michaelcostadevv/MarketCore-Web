import { Link, Outlet, useLocation } from 'react-router'
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
