import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { startPwaUpdates } from './pwa-update';
import { AppRouter } from './router';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);

startPwaUpdates();
