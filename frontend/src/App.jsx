import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import QRList from './pages/QRList';
import QRDetail from './pages/QRDetail';
import UserList from './pages/UserList';
import UserDetail from './pages/UserDetail';
import NotFound from './pages/NotFound';

function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/qrcodes"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <QRList />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/qrcodes/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <QRDetail />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <Layout>
                        <UserList />
                      </Layout>
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users/:id"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <Layout>
                        <UserDetail />
                      </Layout>
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
