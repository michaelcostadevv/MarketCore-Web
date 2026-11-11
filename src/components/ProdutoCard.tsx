import { Link } from 'react-router'
import type { Produto } from '../api/types'
import { formatarPreco } from '../lib/formatar'

export function ProdutoCard({ produto }: { produto: Produto }) {
  const esgotado = produto.quantidade === 0

  return (
    <Link
      to={`/produtos/${produto.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-indigo-300 hover:shadow-md"
    >
      <ImagemProduto produto={produto} className="aspect-square" />

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="line-clamp-2 font-medium text-slate-900 group-hover:text-indigo-700">
          {produto.nome}
        </h2>
        <div className="mt-auto flex items-center justify-between pt-2">
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
export function ImagemProduto({ produto, className = '' }: { produto: Produto; className?: string }) {
  if (!produto.imagemUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-sm text-slate-400 ${className}`}>
        Sem imagem
      </div>
    )
  }
  return (
    <img
      src={produto.imagemUrl}
      alt={produto.nome}
      loading="lazy"
      className={`bg-slate-100 object-cover ${className}`}
    />
  )
}
