import { type FormEvent, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useProdutos } from '../api/produtos'
import { MensagemErro } from '../components/MensagemErro'
import { Paginacao } from '../components/Paginacao'
import { ProdutoCard } from '../components/ProdutoCard'
import { lerInteiroPositivo } from '../lib/numeros'

const POR_PAGINA = 12

export function Vitrine() {
  // A busca e a página ficam na URL (?nome=teclado&pagina=2): dá para compartilhar o link,
  // e os botões voltar/avançar do navegador funcionam sem nenhum código extra.
  const [params, setParams] = useSearchParams()
  const nome = params.get('nome') ?? ''
  const pagina = lerInteiroPositivo(params.get('pagina')) ?? 1 // valores inválidos viram a página 1

  const { data, isPending, isError, error, isPlaceholderData } = useProdutos({
    nome: nome || undefined,
    page: pagina - 1, // a API conta páginas a partir de 0
    size: POR_PAGINA,
  })

  // Link antigo ou digitado à mão (?pagina=9 com só 3 páginas): leva para a última página.
  // replace: true troca a URL sem criar uma entrada nova no histórico do botão voltar.
  const totalPaginas = data?.page.totalPages ?? 0
  useEffect(() => {
    if (totalPaginas > 0 && pagina > totalPaginas) {
      const corrigidos = new URLSearchParams(params)
      corrigidos.set('pagina', String(totalPaginas))
      setParams(corrigidos, { replace: true })
    }
  }, [pagina, totalPaginas, params, setParams])

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault() // impede o navegador de recarregar a página
    const termo = String(new FormData(evento.currentTarget).get('nome') ?? '').trim()
    setParams(termo ? { nome: termo } : {}) // nova busca volta para a página 1
  }

  function irParaPagina(nova: number) {
    const proximos = new URLSearchParams(params)
    proximos.set('pagina', String(nova))
    setParams(proximos)
    window.scrollTo?.({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Produtos</h1>
          {data && (
            <p className="text-sm text-slate-500">
              {data.page.totalElements} {data.page.totalElements === 1 ? 'produto' : 'produtos'}
              {nome && ` para “${nome}”`}
            </p>
          )}
        </div>

        {/* key={nome}: quando a busca muda pela URL (ex.: botão voltar), o campo é recriado com o novo valor */}
        <form role="search" onSubmit={buscar} className="flex gap-2" key={nome}>
          <input
            type="search"
            name="nome"
            defaultValue={nome}
            aria-label="Buscar produtos"
            placeholder="Buscar por nome…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:w-64"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Buscar
          </button>
        </form>
      </div>

      {isPending ? (
        <GradeCarregando />
      ) : isError ? (
        <MensagemErro erro={error} />
      ) : data.content.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Nenhum produto encontrado
        </p>
      ) : (
        <>
          {/* aria-busy: enquanto a próxima página carrega, a lista mostrada ainda é a anterior */}
          <ul
            aria-label="Produtos"
            aria-busy={isPlaceholderData}
            className={`grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 ${isPlaceholderData ? 'opacity-60' : ''}`}
          >
            {data.content.map((produto) => (
              <li key={produto.id} className="flex">
                <ProdutoCard produto={produto} />
              </li>
            ))}
          </ul>
          <Paginacao pagina={pagina} totalPaginas={data.page.totalPages} aoMudar={irParaPagina} />
        </>
      )}
    </section>
  )
}

function GradeCarregando() {
  return (
    <div role="status">
      {/* Texto só para leitores de tela; os blocos cinza são só visuais (aria-hidden) */}
      <span className="sr-only">Carregando produtos…</span>
      <ul aria-hidden="true" className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-slate-200" />
        ))}
      </ul>
    </div>
  )
}
