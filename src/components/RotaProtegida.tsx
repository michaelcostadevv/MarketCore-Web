import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'

/**
 * Envolve rotas que exigem login. Sem usuário, manda para /login guardando
 * a página pedida em ?voltar=, para a pessoa voltar para ela depois de entrar.
 * Isso é só experiência do usuário: quem protege os dados de verdade é a API (401/404).
 */
export function RotaProtegida() {
  const { usuario, carregando } = useAuth()
  const { pathname, search } = useLocation()

  if (carregando) return <p role="status" className="text-slate-500">Carregando…</p>
  if (!usuario) {
    const voltar = encodeURIComponent(pathname + search)
    return <Navigate to={`/login?voltar=${voltar}`} replace />
  }
  return <Outlet />
}
