import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'katex/dist/katex.min.css'
import App from './App.tsx'
import { initTheme } from './lib/theme'

// Before render: index.html already set the class to avoid a flash, but this
// installs the OS-preference listener that keeps "system" live.
initTheme()

if (import.meta.env.PROD) {
  const s = document.createElement('script')
  s.defer = true
  s.src = 'https://cloud.umami.is/script.js'
  s.setAttribute('data-website-id', '332c2584-cfe8-43da-a94f-671e1edf61ed')
  document.head.appendChild(s)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
