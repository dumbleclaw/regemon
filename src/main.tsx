import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import App from './App'
import './index.css'

const appId = import.meta.env.VITE_PRIVY_APP_ID || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['google', 'email'],
        appearance: {
          theme: 'dark',
          accentColor: '#e94560',
        },
      }}
    >
      <App />
    </PrivyProvider>
  </StrictMode>,
)
