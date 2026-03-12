import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { initFacebookSDK } from './lib/facebook';
import './styles/index.css';

initFacebookSDK();

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace' }}>
          <h2 style={{ color: 'red' }}>Runtime error</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{(this.state.error as Error).message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#666' }}>{(this.state.error as Error).stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <App />
            <Toaster position="top-center" richColors />
          </QueryClientProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
