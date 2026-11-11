import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { podeCancelar, useCancelarPedido, usePedido } from '../api/pedidos'
import { MensagemErro } from '../components/MensagemErro'
import { StatusBadge } from '../components/StatusBadge'
import { formatarData, formatarPreco } from '../lib/formatar'
import { lerInteiroPositivo } from '../lib/numeros'
import { NaoEncontrada } from './NaoEncontrada'

export function PedidoDetalhe() {
  const id = lerInteiroPositivo(useParams().id)
  if (id === null) return <NaoEncontrada mensagem="Pedido não encontrado" />
  return <Detalhe id={id} />
}

function Detalhe({ id }: { id: number }) {
  const { data: pedido, isPending, error } = usePedido(id)
  const [cancelado, setCancelado] = useState(false)

  if (isPending) {
    return (
      <p role="status" className="text-slate-500">
        Carregando…
      </p>
    )
  }
  // A API responde 404 tanto para pedido inexistente quanto para pedido de OUTRA pessoa:
  // assim ela nem confirma que aquele número existe (proteção contra IDOR)
  if (error instanceof ApiError && error.status === 404) return <NaoEncontrada mensagem="Pedido não encontrado" />
  if (error) return <MensagemErro erro={error} />

  return (
    <article className="flex flex-col gap-6">
      <Link to="/pedidos" className="text-sm text-indigo-600 hover:underline">
        ← Meus pedidos
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900">Pedido #{pedido.id}</h1>
          <p className="text-sm text-slate-500">{formatarData(pedido.dataPedido)}</p>
        </div>
        <StatusBadge status={pedido.statusPedido} />
      </header>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <caption className="sr-only">Itens do pedido #{pedido.id}</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Produto
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Qtd.
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Preço unit.
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pedido.itens.map((item) => (
              <tr key={item.produtoId}>
                <td className="px-4 py-3">
                  <Link to={`/produtos/${item.produtoId}`} className="text-slate-900 hover:text-indigo-700">
                    {item.nomeProduto}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">{item.quantidade}</td>
                <td className="px-4 py-3 text-right">{formatarPreco(item.precoUnitario)}</td>
                <td className="px-4 py-3 text-right">{formatarPreco(item.subTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200">
            <tr>
              <th scope="row" colSpan={3} className="px-4 py-3 text-right font-medium text-slate-600">
                Total
              </th>
              <td data-testid="total" className="px-4 py-3 text-right text-base font-bold text-slate-900">
                {formatarPreco(pedido.valorTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {podeCancelar(pedido.statusPedido) && <Cancelamento id={pedido.id} aoCancelar={() => setCancelado(true)} />}

      {/* Região viva: anuncia o resultado para leitores de tela (o botão some depois do cancelamento) */}
      <p role="status" className="text-sm text-emerald-700">
        {cancelado && 'Pedido cancelado. Os itens voltaram para o estoque.'}
      </p>
    </article>
  )
}

/** Cancelar não tem volta: pedimos confirmação na própria página (sem o window.confirm do navegador). */
function Cancelamento({ id, aoCancelar }: { id: number; aoCancelar: () => void }) {
  const [confirmando, setConfirmando] = useState(false)
  const cancelar = useCancelarPedido()
  const botaoCancelar = useRef<HTMLButtonElement>(null)
  const botaoConfirmar = useRef<HTMLButtonElement>(null)
  const devolverFoco = useRef(false)

  // Foco do teclado: o botão clicado some quando a confirmação abre (e vice-versa).
  // Sem isso o foco cairia no <body> e quem navega pelo teclado teria de recomeçar do topo.
  useEffect(() => {
    if (confirmando) botaoConfirmar.current?.focus()
    else if (devolverFoco.current) botaoCancelar.current?.focus()
  }, [confirmando])

  function desistir() {
    devolverFoco.current = true
    setConfirmando(false)
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {cancelar.isError && <MensagemErro erro={cancelar.error} />}
      {!confirmando ? (
        <button
          ref={botaoCancelar}
          type="button"
          onClick={() => setConfirmando(true)}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Cancelar pedido
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          <span className="text-red-800">Cancelar este pedido? Os itens voltam para o estoque.</span>
          <button
            ref={botaoConfirmar}
            type="button"
            disabled={cancelar.isPending}
            onClick={() =>
              cancelar.mutate(id, {
                onSuccess: aoCancelar,
                onError: desistir,
              })
            }
            className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {cancelar.isPending ? 'Cancelando…' : 'Sim, cancelar'}
          </button>
          <button
            type="button"
            onClick={desistir}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-white"
          >
            Não
          </button>
        </div>
      )}
    </div>
  )
}
