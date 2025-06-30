import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import Visualizer from './pages/Visualizer';
import EnhancedVisualizer from './pages/EnhancedVisualizer';
import ProfessionalVisualizer from './pages/ProfessionalVisualizer';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import './styles/global.css';

// Main application component with routing and authentication
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Professional Medical Viewer (full screen, no layout) */}
          <Route path="/medical-viewer/:scanId" element={<ProfessionalVisualizer />} />
          
          {/* Standard application routes with layout */}
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/visualizer/:scanId" element={<Visualizer />} />
                <Route path="/enhanced-viewer/:scanId" element={<EnhancedVisualizer />} />
                <Route path="/advanced-analytics/:scanId" element={<AdvancedAnalytics />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;