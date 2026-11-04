import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter, Routes, Route } from 'react-router-dom';
import OnboardingFlow from './pages/app/OnboardingFlow.jsx';
import AdminApp from './pages/admin/AdminVettingForm.jsx'; 
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import ProximityAdmin from './pages/admin/ProximityAdmin.jsx';
import './lib/simulation';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';


import 'leaflet/dist/leaflet.css'
import "./index.css"
import './styles/themes.css'
setWorkerUrl(maplibreWorkerUrl);

// ─── Set theme before first paint ───
document.documentElement.setAttribute(
  'data-theme',
  localStorage.getItem('raptor-theme') || 'sky-blue'
);
/* What to do right now (no hardware): 
demo solution. */ 
if (!localStorage.getItem('raptor:user-guid')) {
  const localGuid = crypto.randomUUID();
  localStorage.setItem('raptor:user-guid', localGuid);
  console.log('[Dev] Generated local GUID:', localGuid);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnboardingFlow />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminApp />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/proximity"
          element={
            <ProtectedRoute requiredRole="admin">
              <ProximityAdmin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
