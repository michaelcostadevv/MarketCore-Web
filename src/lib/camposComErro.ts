import { ApiError } from '../api/client'

/**
 * Descobre quais campos a API recusou, a partir dos "detalhes" do erro 400
 * (formato da API: "campo: mensagem", ex.: "password: A senha deve ter entre 8 e 72 caracteres").
 *
 * @param nomesNoFormulario traduz o nome do campo na API para o name do campo no formulário
 *        (ex.: a API chama de "password" o que no formulário é "senha")
 */
export function camposComErro(erro: unknown, nomesNoFormulario: Record<string, string>): Set<string> {
  const campos = new Set<string>()
  if (!(erro instanceof ApiError)) return campos
  for (const detalhe of erro.detalhes) {
    const campoApi = detalhe.split(':')[0]?.trim()
    const campo = campoApi ? nomesNoFormulario[campoApi] : undefined
    if (campo) campos.add(campo)
  }
  return campos
}
