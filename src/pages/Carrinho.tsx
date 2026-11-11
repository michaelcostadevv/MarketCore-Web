import { Link, useNavigate } from 'react-router'
import { useCriarPedido } from '../api/pedidos'
import { useAuth } from '../auth/useAuth'
import type { ItemCarrinho } from '../carrinho/carrinho'
import { useCarrinho } from '../carrinho/useCarrinho'
import { MensagemErro } from '../components/MensagemErro'
import { ImagemProduto } from '../components/ProdutoCard'
import { formatarPreco } from '../lib/formatar'

export function Carrinho() {
  const { itens, total, limpar } = useCarrinho()
  const navigate = useNavigate()
  const criarPedido = useCriarPedido()

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-lg text-slate-700">Seu carrinho está vazio</p>
        <Link to="/" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Ver produtos
        </Link>
      </div>
    )
  }

  function finalizar() {
    criarPedido.mutate(
      itens.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
      {
        onSuccess: (pedido) => {
          limpar()
          navigate(`/pedidos/${pedido.id}`)
        },
      },
    )
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Carrinho</h1>
        <ul className="flex flex-col divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {itens.map((item) => (
            <LinhaCarrinho key={item.produto.id} item={item} />
          ))}
        </ul>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
        <div className="flex items-baseline justify-between">
          <span className="text-slate-600">Total</span>
          <span data-testid="total" className="text-2xl font-bold text-slate-900">
            {formatarPreco(total)}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Valor estimado. O total final (com preço e estoque atualizados) é calculado ao criar o pedido.
        </p>
        {criarPedido.isError && <MensagemErro erro={criarPedido.error} />}
        <AcaoFinalizar enviando={criarPedido.isPending} aoFinalizar={finalizar} />
      </aside>
    </section>
  )
}

/** O botão muda conforme quem está vendo: visitante, admin (sem cadastro de cliente) ou cliente. */
function AcaoFinalizar({ enviando, aoFinalizar }: { enviando: boolean; aoFinalizar: () => void }) {
  const { usuario, carregando } = useAuth()
  const botao = 'w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-indigo-700'

  if (carregando) return null
  if (!usuario) {
    return (
      <Link to={`/login?voltar=${encodeURIComponent('/carrinho')}`} className={botao}>
        Entrar para finalizar
      </Link>
    )
  }
  if (usuario.clienteId === null) {
    return (
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        Esta conta não possui cadastro de cliente (contas de administrador só gerenciam a loja). Entre com uma
        conta de cliente para fazer pedidos.
      </p>
    )
  }
  return (
    <button type="button" onClick={aoFinalizar} disabled={enviando} className={`${botao} disabled:opacity-60`}>
      {enviando ? 'Enviando pedido…' : 'Finalizar pedido'}
    </button>
  )
}

function LinhaCarrinho({ item }: { item: ItemCarrinho }) {
  const { alterarQuantidade, remover } = useCarrinho()
  const { produto, quantidade } = item
  const subtotal = Math.round(produto.preco * 100 * quantidade) / 100
  const botaoQtd =
    'h-9 w-9 rounded-lg border border-slate-300 text-lg leading-none text-slate-700 hover:bg-slate-50 disabled:opacity-40'

  return (
    <li aria-label={produto.nome} className="flex flex-wrap items-center gap-4 p-4">
      <ImagemProduto produto={produto} className="h-16 w-16 shrink-0 rounded-lg text-[10px]" />

      <div className="min-w-0 flex-1">
        <Link to={`/produtos/${produto.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
          {produto.nome}
        </Link>
        <p className="text-sm text-slate-500">{formatarPreco(produto.preco)} cada</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Diminuir quantidade de ${produto.nome}`}
          className={botaoQtd}
          disabled={quantidade <= 1}
          onClick={() => alterarQuantidade(produto.id, quantidade - 1)}
        >
          −
        </button>
        <input
          type="number"
          aria-label={`Quantidade de ${produto.nome}`}
          min={1}
          max={produto.quantidade}
          value={quantidade}
          // Campo apagado (""): espera a pessoa digitar, em vez de pular para 1 no meio da edição
          onChange={(e) => e.target.value !== '' && alterarQuantidade(produto.id, Number(e.target.value))}
          className="h-9 w-14 rounded-lg border border-slate-300 text-center text-sm"
        />
        <button
          type="button"
          aria-label={`Aumentar quantidade de ${produto.nome}`}
          className={botaoQtd}
          disabled={quantidade >= produto.quantidade}
          onClick={() => alterarQuantidade(produto.id, quantidade + 1)}
        >
          +
        </button>
      </div>

      <div className="flex w-28 flex-col items-end gap-1">
        <span className="font-semibold text-slate-900">{formatarPreco(subtotal)}</span>
        <button
          type="button"
          aria-label={`Remover ${produto.nome}`}
          onClick={() => remover(produto.id)}
          className="text-xs text-slate-500 hover:text-red-600 hover:underline"
        >
          Remover
        </button>
      </div>
    </li>
  )
}
