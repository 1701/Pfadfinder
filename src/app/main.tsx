import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Scaffold only: router, providers and screens follow in later tasks.
const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <main className="flex min-h-screen items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-primary">Pfadfinder</h1>
    </main>
  </StrictMode>,
);
