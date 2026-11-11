// Intl é a API de internacionalização do próprio JavaScript: formata moeda e data
// no padrão do Brasil sem precisar de biblioteca. Criamos os formatadores uma vez só.
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function formatarPreco(valor: number): string {
  return moeda.format(valor)
}

/** A API manda LocalDateTime sem fuso ("2026-11-09T21:05:00"): é lido como horário local. */
export function formatarData(iso: string): string {
  return dataHora.format(new Date(iso))
}
