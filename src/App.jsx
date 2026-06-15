import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore.js";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateProject from "./pages/CreateProject.jsx";
import Pipeline from "./pages/Pipeline.jsx";
import Results from "./pages/Results.jsx";
import Settings from "./pages/Settings.jsx";
import History from "./pages/History.jsx";
import Auth from "./pages/Auth.jsx";
import Pricing from "./pages/Pricing.jsx";
import Assistant from "./pages/Assistant.jsx";
import MarketAnalysis from "./pages/MarketAnalysis.jsx";
import BusinessGenerator from "./pages/BusinessGenerator.jsx";
import Coach from "./pages/Coach.jsx";
import RevenueDashboard from "./pages/RevenueDashboard.jsx";
import TikTokAudit from "./pages/TikTokAudit.jsx";
import ListingGenerator from "./pages/ListingGenerator.jsx";
import ProductScorer from "./pages/ProductScorer.jsx";
import TrendDetector from "./pages/TrendDetector.jsx";
import AutoResponder from "./pages/AutoResponder.jsx";
import AdGenerator from "./pages/AdGenerator.jsx";
import ProductSheets from "./pages/ProductSheets.jsx";
import ReviewManager from "./pages/ReviewManager.jsx";
import ProductAuth from "./pages/ProductAuth.jsx";
import ShopifyManager from "./pages/ShopifyManager.jsx";
import ImageGenerator from "./pages/ImageGenerator.jsx";
import WebsiteBuilder from "./pages/WebsiteBuilder.jsx";
import Studio3D from "./pages/Studio3D.jsx";
import Model3DGenerator from "./pages/Model3DGenerator.jsx";
import Stock from "./pages/Stock.jsx";
import Admin from "./pages/Admin.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", fontSize:14, color:"#888" }}>Chargement...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const { init } = useAuthStore();
  useEffect(() => { init(); }, []);
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="layout">
            <Sidebar />
            <main className="main">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/coach" element={<Coach />} />
                <Route path="/revenue" element={<RevenueDashboard />} />
                <Route path="/market" element={<MarketAnalysis />} />
                <Route path="/scorer" element={<ProductScorer />} />
                <Route path="/trends" element={<TrendDetector />} />
                <Route path="/listing" element={<ListingGenerator />} />
                <Route path="/responder" element={<AutoResponder />} />
                <Route path="/business" element={<BusinessGenerator />} />
                <Route path="/sheets" element={<ProductSheets />} />
                <Route path="/ads" element={<AdGenerator />} />
                <Route path="/reviews" element={<ReviewManager />} />
                <Route path="/auth-product" element={<ProductAuth />} />
                <Route path="/shopify" element={<ShopifyManager />} />
                <Route path="/images" element={<ImageGenerator />} />
                <Route path="/website-builder" element={<WebsiteBuilder />} />
                <Route path="/studio-3d" element={<Studio3D />} />
                <Route path="/model-3d" element={<Model3DGenerator />} />
                <Route path="/stock" element={<Stock />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/tiktok-audit" element={<TikTokAudit />} />
                <Route path="/create" element={<CreateProject />} />
                <Route path="/pipeline" element={<Pipeline />} />
                <Route path="/results" element={<Results />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/history" element={<History />} />
              </Routes>
            </main>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}
