import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerGlobalErrorHandlers } from './utils/globalErrorHandlers'
import './index.css'
import App from './App.tsx'

// Catch uncaught errors and unhandled rejections before React mounts
registerGlobalErrorHandlers();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
