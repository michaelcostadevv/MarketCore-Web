import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { useProduto } from '../api/produtos'
import { MensagemErro } from '../components/MensagemErro'
import { ImagemProduto } from '../components/ProdutoCard'
import { formatarPreco } from '../lib/formatar'
import { lerInteiroPositivo } from '../lib/numeros'
import { NaoEncontrada } from './NaoEncontrada'

export function ProdutoDetalhe() {
  const id = lerInteiroPositivo(useParams().id)
  // "/produtos/abc" ou "/produtos/1e30" não devem nem chamar a API
  if (id === null) return <NaoEncontrada mensagem="Produto não encontrado" />
  return <Detalhe id={id} />
}

function Detalhe({ id }: { id: number }) {
  const { data: produto, isPending, error } = useProduto(id)

  if (isPending) return <p className="text-slate-500">Carregando…</p>
  if (error instanceof ApiError && error.status === 404) {
    return <NaoEncontrada mensagem="Produto não encontrado" />
  }
  if (error) return <MensagemErro erro={error} />

  return (
    <article className="flex flex-col gap-6">
      <Link to="/" className="text-sm text-indigo-600 hover:underline">
        ← Voltar para a vitrine
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <ImagemProduto produto={produto} className="aspect-square w-full rounded-xl" />

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold text-slate-900">{produto.nome}</h1>
          <p className="text-3xl font-bold text-slate-900">{formatarPreco(produto.preco)}</p>
          <p className={produto.quantidade > 0 ? 'text-sm text-emerald-700' : 'text-sm text-slate-500'}>
            {produto.quantidade > 0 ? `${produto.quantidade} em estoque` : 'Esgotado'}
          </p>
          {produto.descricao && (
            <p className="whitespace-pre-line leading-relaxed text-slate-700">{produto.descricao}</p>
          )}
        </div>
      </div>
    </article>
  )
}
