import { useEffect, useRef } from 'react'
import { ApiError } from '../api/client'

type Props = {
  erro: unknown
  /** id para os campos apontarem para a mensagem com aria-describedby. */
  id?: string
  /**
   * Leva o foco do teclado para a mensagem quando ela aparece. Usado nos formulários: o botão
   * de enviar fica desabilitado durante o envio e o foco cairia no <body>, obrigando quem usa
   * teclado a recomeçar do topo da página.
   */
  focar?: boolean
}

/** Mostra qualquer erro do jeito padrão: mensagem da API e, se houver, os erros por campo. */
export function MensagemErro({ erro, id, focar = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mensagem = erro instanceof Error ? erro.message : 'Algo deu errado'
  const detalhes = erro instanceof ApiError ? erro.detalhes : []

  useEffect(() => {
    if (focar) ref.current?.focus()
  }, [focar, erro]) // um erro novo foca de novo

  return (
    <div
      ref={ref}
      id={id}
      role="alert"
      tabIndex={focar ? -1 : undefined} // -1: pode receber foco por código, sem entrar na ordem do Tab
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
    >
      <p className="font-medium">{mensagem}</p>
      {detalhes.length > 0 && (
        <ul className="mt-2 list-inside list-disc">
          {detalhes.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
