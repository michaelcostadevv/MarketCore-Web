/**
 * Lê um número inteiro positivo de um texto da URL (ex.: ?pagina=2, /produtos/7).
 * Devolve null para qualquer outra coisa: "abc", "0", "-3", "1.5", "1e10", números gigantes.
 * Number("1.5") e Number("1e10") "funcionariam", por isso exigimos só dígitos.
 */
export function lerInteiroPositivo(texto: string | null | undefined): number | null {
  if (!texto || !/^\d+$/.test(texto)) return null
  const numero = Number(texto)
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null
}
