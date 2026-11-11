import type { InputHTMLAttributes, ReactNode } from 'react'

/** Peças visuais compartilhadas pelos formulários de login e cadastro. */

export function CartaoFormulario({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">{titulo}</h1>
      {children}
    </div>
  )
}

type CampoProps = InputHTMLAttributes<HTMLInputElement> & { rotulo: string; name: string }

export function Campo({ rotulo, name, ...props }: CampoProps) {
  // htmlFor + id ligam o rótulo ao campo: clicar no texto foca o campo,
  // e leitores de tela anunciam o rótulo (é também como os testes acham o campo)
  const id = `campo-${name}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {rotulo}
      </label>
      <input
        id={id}
        name={name}
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        {...props}
      />
    </div>
  )
}

export function BotaoPrincipal({ children, enviando }: { children: ReactNode; enviando: boolean }) {
  return (
    <button
      type="submit"
      disabled={enviando}
      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
    >
      {children}
    </button>
  )
}
