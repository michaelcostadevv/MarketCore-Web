import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { BotaoPrincipal, Campo, CartaoFormulario } from '../components/Formulario'
import { MensagemErro } from '../components/MensagemErro'
import { destinoSeguro } from '../lib/destino'

const ID_ERRO = 'erro-login'

export function Login() {
  const { usuario, carregando, login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const destino = destinoSeguro(params.get('voltar'))
  const [erro, setErro] = useState<unknown>(null)
  const [enviando, setEnviando] = useState(false)

  // Ainda confirmando um token salvo com a API: espera para saber se a pessoa já está logada
  if (carregando) return <p role="status" className="text-center text-slate-500">Carregando…</p>
  // Já logado (ex.: abriu /login de um favorito): não faz sentido mostrar o formulário
  if (usuario && !enviando) return <Navigate to={destino} replace />

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    setErro(null)
    setEnviando(true)
    try {
      await login(String(dados.get('email')), String(dados.get('senha')))
      navigate(destino, { replace: true }) // replace: o botão voltar não retorna ao formulário
    } catch (e) {
      setErro(e)
      setEnviando(false)
    }
  }

  return (
    <CartaoFormulario titulo="Entrar">
      <form onSubmit={enviar} className="flex flex-col gap-4">
        {/* aria-describedby liga os campos à mensagem de erro: ao voltar a um campo,
            o leitor de tela lê o rótulo e em seguida o erro */}
        <Campo
          rotulo="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          aria-describedby={erro !== null ? ID_ERRO : undefined}
        />
        <Campo
          rotulo="Senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          aria-describedby={erro !== null ? ID_ERRO : undefined}
        />
        {erro !== null && <MensagemErro erro={erro} id={ID_ERRO} focar />}
        <BotaoPrincipal enviando={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</BotaoPrincipal>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Não tem conta?{' '}
        <Link to="/cadastro" className="font-medium text-indigo-600 hover:underline">
          Criar conta
        </Link>
      </p>
    </CartaoFormulario>
  )
}
