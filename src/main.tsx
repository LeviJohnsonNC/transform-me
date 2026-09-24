import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { installResumeHeartbeat } from './lib/resumeState'

installResumeHeartbeat();

createRoot(document.getElementById("root")!).render(<App />);
