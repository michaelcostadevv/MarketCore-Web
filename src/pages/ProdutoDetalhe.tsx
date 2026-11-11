import { type FormEvent, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { useProduto } from '../api/produtos'
import type { Produto } from '../api/types'
import { useCarrinho } from '../carrinho/useCarrinho'
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

  if (isPending) {
    return (
      <p role="status" className="text-slate-500">
        Carregando…
      </p>
    )
  }
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
          <AdicionarAoCarrinho produto={produto} />
          {produto.descricao && (
            <p className="whitespace-pre-line leading-relaxed text-slate-700">{produto.descricao}</p>
          )}
        </div>
      </div>
    </article>
  )
}

function AdicionarAoCarrinho({ produto }: { produto: Produto }) {
  const { adicionar } = useCarrinho()
  // Guardamos o texto do campo (e não um número) para a pessoa poder apagar e digitar livremente
  const [quantidade, setQuantidade] = useState('1')
  const [adicionado, setAdicionado] = useState(false)
  const esgotado = produto.quantidade <= 0

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    adicionar(produto, Number(quantidade)) // as regras do carrinho limitam entre 1 e o estoque
    setAdicionado(true)
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        {!esgotado && (
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Quantidade
            <input
              type="number"
              min={1}
              max={produto.quantidade}
              required
              value={quantidade}
              onChange={(e) => {
                setQuantidade(e.target.value)
                setAdicionado(false)
              }}
              className="h-11 w-20 rounded-lg border border-slate-300 px-3 text-center"
            />
          </label>
        )}
        <button
          type="submit"
          disabled={esgotado}
          className="h-11 flex-1 rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:flex-none"
        >
          {esgotado ? 'Esgotado' : 'Adicionar ao carrinho'}
        </button>
      </div>
      {adicionado && (
        <p role="status" className="text-sm text-emerald-700">
          Adicionado ao carrinho.{' '}
          <Link to="/carrinho" className="font-medium underline">
            Ver carrinho
          </Link>
        </p>
      )}
    </form>
  )
}
