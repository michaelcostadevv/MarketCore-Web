import { Link } from 'react-router'

export function NaoEncontrada({ mensagem = 'Página não encontrada' }: { mensagem?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <p className="text-lg text-slate-700">{mensagem}</p>
      <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
        Voltar para a vitrine
      </Link>
    </div>
  )
}
