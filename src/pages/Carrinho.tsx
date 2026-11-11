import { useQueries } from '@tanstack/react-query'
import { type KeyboardEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { useCriarPedido } from '../api/pedidos'
import { buscarProduto } from '../api/produtos'
import type { Produto } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { type ItemCarrinho, sincronizar } from '../carrinho/carrinho'
import { useCarrinho } from '../carrinho/useCarrinho'
import { MensagemErro } from '../components/MensagemErro'
import { ImagemProduto } from '../components/ProdutoCard'
import { formatarPreco } from '../lib/formatar'

export function Carrinho() {
  const { itens, total, limpar } = useCarrinho()
  const navigate = useNavigate()
  const criarPedido = useCriarPedido({ aoCriar: limpar })
  const avisos = useSincronizacaoComApi()

  // Mexeu no carrinho depois de um erro: a mensagem antiga já não vale
  const { reset } = criarPedido
  useEffect(() => reset(), [itens, reset])

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Avisos avisos={avisos} />
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
      { onSuccess: (pedido) => navigate(`/pedidos/${pedido.id}`) }, // só navega se a página ainda estiver aberta
    )
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Carrinho</h1>
        <Avisos avisos={avisos} />
        <ul className="flex flex-col divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {itens.map((item) => (
            <LinhaCarrinho key={item.produto.id} item={item} />
          ))}
        </ul>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
        <div className="flex items-baseline justify-between">
          <span className="text-slate-600">Total</span>
          {/* aria-live: leitores de tela anunciam o novo total quando a quantidade muda */}
          <span data-testid="total" aria-live="polite" className="text-2xl font-bold text-slate-900">
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

/**
 * Confere os produtos do carrinho com a API (preço, estoque, se ainda existem) ao abrir a
 * página e sempre que a vitrine for invalidada (ex.: pedido recusado). Devolve os avisos
 * do que mudou, para a pessoa entender por que o carrinho está diferente.
 */
function useSincronizacaoComApi(): string[] {
  const { itens, substituir } = useCarrinho()
  const [avisos, setAvisos] = useState<string[]>([])

  const consultas = useQueries({
    queries: itens.map((item) => ({
      queryKey: ['produtos', item.produto.id],
      queryFn: () => buscarProduto(item.produto.id),
      staleTime: 0, // no carrinho queremos sempre o dado mais recente
    })),
  })

  // Só sincroniza quando todas as consultas terminaram. A "assinatura" resume os resultados
  // em texto para o efeito rodar apenas quando algo realmente mudou.
  const terminou = consultas.every((c) => !c.isFetching)
  const assinatura = consultas.map((c) => `${c.status}:${JSON.stringify(c.data ?? null)}`).join('|')

  useEffect(() => {
    if (!terminou) return
    const atuais = new Map<number, Produto | null>()
    itens.forEach((item, i) => {
      const consulta = consultas[i]
      if (consulta?.data) atuais.set(item.produto.id, consulta.data)
      else if (consulta?.error instanceof ApiError && consulta.error.status === 404) atuais.set(item.produto.id, null)
      // outros erros (ex.: rede): não dá para conferir, o item fica como está
    })
    const resultado = sincronizar(itens, atuais)
    if (resultado.mudou) substituir(resultado.itens)
    if (resultado.avisos.length > 0) setAvisos(resultado.avisos)
    // consultas muda de identidade a cada render; "assinatura" representa o conteúdo dela
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminou, assinatura, itens, substituir])

  return avisos
}

function Avisos({ avisos }: { avisos: string[] }) {
  // role="status" é uma "região viva": leitores de tela anunciam o texto quando ele aparece
  return (
    <div role="status" aria-label="Carrinho atualizado">
      {avisos.length > 0 && (
        <ul className="list-inside list-disc rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
          {avisos.map((aviso) => (
            <li key={aviso}>{aviso}</li>
          ))}
        </ul>
      )}
    </div>
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
    <li aria-labelledby={`item-${produto.id}`} className="flex flex-wrap items-center gap-4 p-4">
      <ImagemProduto produto={produto} decorativa className="h-16 w-16 shrink-0 rounded-lg text-[10px]" />

      <div className="min-w-0 flex-1">
        <Link id={`item-${produto.id}`} to={`/produtos/${produto.id}`} className="font-medium text-slate-900 hover:text-indigo-700">
          {produto.nome}
        </Link>
        <p className="text-sm text-slate-500">{formatarPreco(produto.preco)} cada</p>
      </div>

      <div className="flex flex-col items-center gap-1">
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
          <CampoQuantidade item={item} />
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
        <span className="text-xs text-slate-400">máx. {produto.quantidade}</span>
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

/**
 * O campo guarda o TEXTO digitado e só aplica ao carrinho ao sair dele (ou com Enter).
 * Assim a pessoa pode apagar o número para digitar outro sem o campo "pular" no meio.
 */
function CampoQuantidade({ item }: { item: ItemCarrinho }) {
  const { alterarQuantidade } = useCarrinho()
  const { produto, quantidade } = item
  const [texto, setTexto] = useState(String(quantidade))

  // A quantidade mudou por fora (+/−, sincronização com a API)? O campo acompanha.
  // Ajustar o estado durante a renderização é o padrão recomendado pelo React para isso:
  // diferente de recriar o campo (key), não tira o foco de quem está digitando.
  const [quantidadeAnterior, setQuantidadeAnterior] = useState(quantidade)
  if (quantidade !== quantidadeAnterior) {
    setQuantidadeAnterior(quantidade)
    setTexto(String(quantidade))
  }

  function aplicar() {
    const numero = Number.parseInt(texto, 10)
    if (Number.isNaN(numero)) {
      setTexto(String(quantidade)) // apagou e saiu: volta ao valor que estava
      return
    }
    const limitado = Math.min(Math.max(numero, 1), produto.quantidade)
    alterarQuantidade(produto.id, limitado)
    setTexto(String(limitado))
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter') aplicar()
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={`Quantidade de ${produto.nome}`}
      min={1}
      max={produto.quantidade}
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={aplicar}
      onKeyDown={aoTeclar}
      className="h-9 w-14 rounded-lg border border-slate-300 text-center text-sm"
    />
  )
}
