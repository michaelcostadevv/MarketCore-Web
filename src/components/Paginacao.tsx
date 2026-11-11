type Props = {
  /** Página atual, começando em 1 (como o usuário conta). */
  pagina: number
  totalPaginas: number
  aoMudar: (pagina: number) => void
}

export function Paginacao({ pagina, totalPaginas, aoMudar }: Props) {
  if (totalPaginas <= 1) return null

  const botao =
    'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-4">
      <button type="button" className={botao} disabled={pagina <= 1} onClick={() => aoMudar(pagina - 1)}>
        Anterior
      </button>
      <span className="text-sm text-slate-600">
        Página {pagina} de {totalPaginas}
      </span>
      <button
        type="button"
        className={botao}
        disabled={pagina >= totalPaginas}
        onClick={() => aoMudar(pagina + 1)}
      >
        Próxima
      </button>
    </nav>
  )
}
