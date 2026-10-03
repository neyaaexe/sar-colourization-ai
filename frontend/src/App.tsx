import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Landing } from './pages/Landing';
import { Workspace } from './pages/Workspace';
import { Loader2, Satellite } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-space-darkest flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-xl bg-sar-deepPurple/30 border border-sar-purple/50 flex items-center justify-center text-sar-cyan mb-4 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
          <Satellite className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <p className="text-xs font-mono text-gray-400 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 text-sar-cyan animate-spin" />
          Initializing SAR Colourization AI...
        </p>
      </div>
    );
  }

  return user ? <Workspace /> : <Landing />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
