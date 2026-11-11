import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { erro: Error | null }

/**
 * "Error boundary": se algum componente filho lançar um erro ao renderizar, o React
 * desmontaria a árvore inteira (tela branca). Este componente captura o erro e mostra
 * uma mensagem no lugar. Precisa ser uma classe: o React ainda não tem hook para isso.
 */
export class LimiteDeErro extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('Erro ao renderizar a página', erro, info.componentStack)
  }

  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">Algo deu errado ao exibir esta página.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 text-sm font-medium underline"
        >
          Recarregar
        </button>
      </div>
    )
  }
}
