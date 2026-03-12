
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ReplicaiProvider } from './context/ReplicaiContext';
import HomePage from './pages/HomePage';
import IdentitySetupPage from './pages/IdentitySetupPage';
import ComposerPage from './pages/ComposerPage';
import MediaPage from './pages/MediaPage';

const App: React.FC = () => {
  return (
    <ReplicaiProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<IdentitySetupPage />} />
          <Route path="/composer" element={<ComposerPage />} />
          <Route path="/media" element={<MediaPage />} />
        </Routes>
      </HashRouter>
    </ReplicaiProvider>
  );
};

export default App;
