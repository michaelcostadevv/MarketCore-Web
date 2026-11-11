import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { BotaoPrincipal, Campo, CartaoFormulario } from '../components/Formulario'
import { MensagemErro } from '../components/MensagemErro'
import { camposComErro } from '../lib/camposComErro'

const ID_ERRO = 'erro-cadastro'
/** Nome do campo na API → name do campo no formulário. */
const NOMES_NA_API = { nome: 'nome', email: 'email', password: 'senha' }

export function Cadastro() {
  const { usuario, carregando, cadastrar } = useAuth()
  const navigate = useNavigate()
  const [erro, setErro] = useState<unknown>(null)
  const [enviando, setEnviando] = useState(false)

  // Campos que a API recusou: 400 traz os detalhes por campo; 409 é e-mail já cadastrado
  const invalidos = camposComErro(erro, NOMES_NA_API)
  if (erro instanceof ApiError && erro.status === 409) invalidos.add('email')

  /** Liga cada campo à sua dica e à mensagem de erro, e marca os campos inválidos. */
  function acessibilidade(campo: string, dica?: string) {
    const descricao = [dica, erro !== null ? ID_ERRO : undefined].filter(Boolean).join(' ')
    return {
      'aria-describedby': descricao || undefined,
      'aria-invalid': invalidos.has(campo) || undefined,
    }
  }

  if (carregando) return <p role="status" className="text-center text-slate-500">Carregando…</p>
  if (usuario && !enviando) return <Navigate to="/" replace />

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    setErro(null)
    setEnviando(true)
    try {
      await cadastrar(String(dados.get('nome')), String(dados.get('email')), String(dados.get('senha')))
      navigate('/', { replace: true })
    } catch (e) {
      setErro(e)
      setEnviando(false)
    }
  }

  return (
    <CartaoFormulario titulo="Criar conta">
      {/* As regras (tamanhos, e-mail) repetem as da API para avisar antes de enviar.
          Quem valida de verdade é a API: os erros dela aparecem em MensagemErro. */}
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Campo rotulo="Nome" name="nome" autoComplete="name" maxLength={120} autoFocus {...acessibilidade('nome')} />
        <Campo rotulo="E-mail" name="email" type="email" autoComplete="email" {...acessibilidade('email')} />
        <Campo
          rotulo="Senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          {...acessibilidade('senha', 'dica-senha')}
        />
        <p id="dica-senha" className="-mt-2 text-xs text-slate-500">
          Entre 8 e 72 caracteres.
        </p>
        {erro !== null && <MensagemErro erro={erro} id={ID_ERRO} focar />}
        <BotaoPrincipal enviando={enviando}>{enviando ? 'Criando conta…' : 'Criar conta'}</BotaoPrincipal>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Entrar
        </Link>
      </p>
    </CartaoFormulario>
  )
}
