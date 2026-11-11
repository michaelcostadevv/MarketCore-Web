import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
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
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}
