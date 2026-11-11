// Adiciona matchers como toBeInTheDocument() ao expect do Vitest
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup() // desmonta os componentes renderizados no teste anterior
  vi.unstubAllGlobals() // desfaz os vi.stubGlobal('fetch', ...)
  localStorage.clear()
})
