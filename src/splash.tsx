import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { Logo } from './application/views/Logo';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="flex h-full w-full items-center justify-center bg-content-area-bg-primary">
      <Logo />
    </div>
  </React.StrictMode>,
);
