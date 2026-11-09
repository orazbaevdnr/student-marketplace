import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ToastProvider } from './components/ui/Toast';
import { Layout } from './components/layout/Layout';

// Pages
import { Login } from './pages/Login';
import { VerifyEmail } from './pages/VerifyEmail';
import { Catalog } from './pages/Catalog';
import { ListingDetails } from './pages/ListingDetails';
import { ListingForm } from './pages/ListingForm';
import { MyListings } from './pages/MyListings';
import { Favorites } from './pages/Favorites';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';

const AppContent: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const isPublicPage = location.pathname === '/login';

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (location.pathname === '/') {
      const next = new URLSearchParams(searchParams);
      if (val) {
        next.set('q', val);
      } else {
        next.delete('q');
      }
      setSearchParams(next, { replace: true });
    }
  };

  if (isPublicPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Layout searchQuery={searchQuery} onSearchChange={handleSearchChange}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Catalog searchQuery={searchQuery} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <ProtectedRoute>
              <VerifyEmail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/listing/:id"
          element={
            <ProtectedRoute>
              <ListingDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/listings/new"
          element={
            <ProtectedRoute>
              <ListingForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/listings/:id/edit"
          element={
            <ProtectedRoute>
              <ListingForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <ProtectedRoute>
              <MyListings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
