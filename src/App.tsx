import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { Cadastro } from './pages/Cadastro'
import { Login } from './pages/Login'
import { NaoEncontrada } from './pages/NaoEncontrada'
import { ProdutoDetalhe } from './pages/ProdutoDetalhe'
import { Vitrine } from './pages/Vitrine'

/** Mapa de rotas: qual página aparece em cada URL. */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Vitrine />} />
        <Route path="produtos/:id" element={<ProdutoDetalhe />} />
        <Route path="login" element={<Login />} />
        <Route path="cadastro" element={<Cadastro />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}
