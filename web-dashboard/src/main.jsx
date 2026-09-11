import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter, Routes, Route } from 'react-router-dom';
import OnboardingFlow from './pages/app/OnboardingFlow.jsx';
import AdminApp from './pages/admin/AdminVettingForm.jsx'; 
import './lib/simulation';
import 'leaflet/dist/leaflet.css'
import "./index.css"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnboardingFlow />} />
        <Route path="/admin" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
