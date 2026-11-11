import { ROTULOS_STATUS } from '../api/pedidos'
import type { StatusPedido } from '../api/types'

const CORES: Record<StatusPedido, string> = {
  PENDENTE: 'bg-amber-100 text-amber-800',
  PAGO: 'bg-sky-100 text-sky-800',
  ENVIADO: 'bg-indigo-100 text-indigo-800',
  ENTREGUE: 'bg-emerald-100 text-emerald-800',
  CANCELADO: 'bg-slate-200 text-slate-700',
}

export function StatusBadge({ status }: { status: StatusPedido }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CORES[status]}`}>
      {ROTULOS_STATUS[status]}
    </span>
  )
}
