import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ROTULOS_STATUS, STATUS_PEDIDO, useMeusPedidos } from '../api/pedidos'
import type { Pedido, StatusPedido } from '../api/types'
import { MensagemErro } from '../components/MensagemErro'
import { Paginacao } from '../components/Paginacao'
import { StatusBadge } from '../components/StatusBadge'
import { formatarData, formatarPreco } from '../lib/formatar'
import { lerInteiroPositivo } from '../lib/numeros'

const POR_PAGINA = 10

function lerStatus(texto: string | null): StatusPedido | undefined {
  return STATUS_PEDIDO.find((s) => s === texto) // ?status=QUALQUER é ignorado
}

export function MeusPedidos() {
  const [params, setParams] = useSearchParams()
  const status = lerStatus(params.get('status'))
  const pagina = lerInteiroPositivo(params.get('pagina')) ?? 1

  const { data, isPending, isError, error, isPlaceholderData } = useMeusPedidos({
    status,
    page: pagina - 1,
    size: POR_PAGINA,
  })

  // Página além da última (link antigo, ou cancelou o único pedido da última página com filtro):
  // leva para a última página, em vez de dizer que não há pedidos
  const totalPaginas = data?.page.totalPages ?? 0
  useEffect(() => {
    if (totalPaginas > 0 && pagina > totalPaginas) {
      const corrigidos = new URLSearchParams(params)
      corrigidos.set('pagina', String(totalPaginas))
      setParams(corrigidos, { replace: true })
    }
  }, [pagina, totalPaginas, params, setParams])

  function filtrar(novo: string) {
    setParams(novo ? { status: novo } : {}) // novo filtro volta para a página 1
  }

  function irParaPagina(nova: number) {
    const proximos = new URLSearchParams(params)
    proximos.set('pagina', String(nova))
    setParams(proximos)
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Meus pedidos</h1>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Status
          <select
            value={status ?? ''}
            onChange={(e) => filtrar(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {STATUS_PEDIDO.map((s) => (
              <option key={s} value={s}>
                {ROTULOS_STATUS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isPending ? (
        <p role="status" className="text-slate-500">
          Carregando…
        </p>
      ) : isError ? (
        <MensagemErro erro={error} />
      ) : data.content.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">
            {status ? `Nenhum pedido ${ROTULOS_STATUS[status].toLowerCase()}` : 'Você ainda não fez nenhum pedido'}
          </p>
          <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
            Ver produtos
          </Link>
        </div>
      ) : (
        <>
          <ul className={`flex flex-col gap-3 ${isPlaceholderData ? 'opacity-60' : ''}`}>
            {data.content.map((pedido) => (
              <li key={pedido.id}>
                <LinhaPedido pedido={pedido} />
              </li>
            ))}
          </ul>
          <Paginacao pagina={pagina} totalPaginas={data.page.totalPages} aoMudar={irParaPagina} />
        </>
      )}
    </section>
  )
}

function LinhaPedido({ pedido }: { pedido: Pedido }) {
  const quantidade = pedido.itens.reduce((soma, i) => soma + i.quantidade, 0)
  return (
    <Link
      to={`/pedidos/${pedido.id}`}
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <span className="font-medium text-slate-900">Pedido #{pedido.id}</span>
        <span className="text-sm text-slate-500">
          {formatarData(pedido.dataPedido)} · {quantidade} {quantidade === 1 ? 'item' : 'itens'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <StatusBadge status={pedido.statusPedido} />
        <span className="font-semibold text-slate-900">{formatarPreco(pedido.valorTotal)}</span>
      </div>
    </Link>
  )
}
