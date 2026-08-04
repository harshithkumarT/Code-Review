import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import { Loader2 } from 'lucide-react';

// Lazy Loaded Route Components for Code Splitting
const Home = lazy(() => import('./pages/Home'));
const NewReview = lazy(() => import('./pages/NewReview'));
const ReviewDetails = lazy(() => import('./pages/ReviewDetails'));
const History = lazy(() => import('./pages/History'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// Suspense Fallback Loading Spinner Component
const PageLoader = () => (
  <div className="min-h-[70vh] flex items-center justify-center text-slate-100">
    <div className="flex items-center space-x-3 text-indigo-400 font-medium">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span className="text-xs">Loading page view...</span>
    </div>
  </div>
);

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Standard User Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/new-review" element={<NewReview />} />
                  <Route path="/reviews/:id" element={<ReviewDetails />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* Protected Role-Based Admin Route */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}
