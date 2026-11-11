import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { RotaProtegida } from './components/RotaProtegida'
import { Cadastro } from './pages/Cadastro'
import { Carrinho } from './pages/Carrinho'
import { Login } from './pages/Login'
import { MeusPedidos } from './pages/MeusPedidos'
import { NaoEncontrada } from './pages/NaoEncontrada'
import { PedidoDetalhe } from './pages/PedidoDetalhe'
import { ProdutoDetalhe } from './pages/ProdutoDetalhe'
import { Vitrine } from './pages/Vitrine'

/** Mapa de rotas: qual página aparece em cada URL. */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Vitrine />} />
        <Route path="produtos/:id" element={<ProdutoDetalhe />} />
        <Route path="carrinho" element={<Carrinho />} />
        <Route path="login" element={<Login />} />
        <Route path="cadastro" element={<Cadastro />} />

        {/* Só para quem está logado: sem login, vai para /login?voltar=... */}
        <Route element={<RotaProtegida />}>
          <Route path="pedidos" element={<MeusPedidos />} />
          <Route path="pedidos/:id" element={<PedidoDetalhe />} />
        </Route>

        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}
