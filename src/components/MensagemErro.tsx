import { ApiError } from '../api/client'

/** Mostra qualquer erro do jeito padrão: mensagem da API e, se houver, os erros por campo. */
export function MensagemErro({ erro }: { erro: unknown }) {
  const mensagem = erro instanceof Error ? erro.message : 'Algo deu errado'
  const detalhes = erro instanceof ApiError ? erro.detalhes : []

  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-medium">{mensagem}</p>
      {detalhes.length > 0 && (
        <ul className="mt-2 list-inside list-disc">
          {detalhes.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
