import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerGlobalErrorHandlers } from './utils/globalErrorHandlers'
import { validateEnvVars } from './utils/envValidation'
import { env } from './config/env'
import './index.css'
import App from './App.tsx'

// Catch uncaught errors and unhandled rejections before React mounts
registerGlobalErrorHandlers();

// Validate environment configuration on startup
const envErrors = validateEnvVars();
if (envErrors.length > 0) {
  console.warn(
    '[startup] Environment configuration issues detected:',
    envErrors,
  );
}

if (import.meta.env.DEV) {
  console.info(`[startup] network=${env.network} env=${env.appEnv} contract=${env.contractAddress}.${env.contractName}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
