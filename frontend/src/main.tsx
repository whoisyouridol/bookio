import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import { RoleProvider } from './contexts/RoleContext';
import { DevRoleSwitcher } from './components/DevRoleSwitcher';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RoleProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-center" richColors />
        <DevRoleSwitcher />
      </QueryClientProvider>
    </RoleProvider>
  </StrictMode>
);
