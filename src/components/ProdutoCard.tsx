import { Link } from 'react-router'
import type { Produto } from '../api/types'
import { formatarPreco } from '../lib/formatar'

export function ProdutoCard({ produto }: { produto: Produto }) {
  const esgotado = produto.quantidade === 0

  return (
    <Link
      to={`/produtos/${produto.id}`}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-indigo-300 hover:shadow-md"
    >
      {/* decorativa: o nome já está no título logo abaixo; com alt o leitor de tela leria duas vezes */}
      <ImagemProduto produto={produto} decorativa className="aspect-square" />

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="line-clamp-2 font-medium text-slate-900 group-hover:text-indigo-700">
          {produto.nome}
        </h2>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-2">
          <span className="text-lg font-semibold text-slate-900">{formatarPreco(produto.preco)}</span>
          {esgotado && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              Esgotado
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/**
 * Imagem do produto ou um placeholder. imagemUrl é opcional na API: sem esta checagem
 * o navegador tentaria carregar src="null" e mostraria um ícone de imagem quebrada.
 */
export function ImagemProduto({
  produto,
  className = '',
  decorativa = false,
}: {
  produto: Produto
  className?: string
  /** true quando o nome do produto já aparece em texto ao lado (card, carrinho): alt vazio. */
  decorativa?: boolean
}) {
  if (!produto.imagemUrl) {
    return (
      <div
        aria-hidden={decorativa || undefined}
        className={`flex items-center justify-center bg-slate-100 text-sm text-slate-400 ${className}`}
      >
        Sem imagem
      </div>
    )
  }
  return (
    <img
      src={produto.imagemUrl}
      alt={decorativa ? '' : produto.nome}
      loading="lazy"
      className={`bg-slate-100 object-cover ${className}`}
    />
  )
}
