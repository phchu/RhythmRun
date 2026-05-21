import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CrashLogger } from './services/CrashLogger.js'

// Initialize crash logger FIRST, before anything else renders
// Captures all JS errors, unhandled promises, and console.error calls
CrashLogger.init();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
