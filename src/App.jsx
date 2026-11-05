import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PublicLayout from './components/PublicLayout';
import PrivateLayout from './components/PrivateLayout';
import { ToastContainer } from './utils/toast';

// Public Pages (Lazy Loaded)
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const VideosPage = lazy(() => import('./pages/VideosPage'));

// Auth Page (Lazy Loaded)
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Private Dashboard Pages (Lazy Loaded)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const ProductsManagementPage = lazy(() => import('./pages/ProductsManagementPage'));
const ServicesManagementPage = lazy(() => import('./pages/ServicesManagementPage'));
const VideosManagementPage = lazy(() => import('./pages/VideosManagementPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventCommandCenterPage = lazy(() => import('./pages/EventCommandCenterPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const WorkersPage = lazy(() => import('./pages/WorkersPage'));
const RolesPermissionsPage = lazy(() => import('./pages/RolesPermissionsPage'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Lightweight Page Loading Skeleton
function PageLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center animate-pulse">
      <div className="w-10 h-10 border-3 border-brand-yellow/30 border-t-brand-yellow rounded-full animate-spin mb-3" />
      <span className="text-xs font-semibold text-gray-400">Loading page...</span>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastContainer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* PUBLIC CUSTOMER-FACING WEBSITE */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:id" element={<ServiceDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          {/* AUTHENTICATION */}
          <Route path="/login" element={<LoginPage />} />

          {/* PRIVATE BUSINESS MANAGEMENT / OPERATIONS PLATFORM */}
          <Route element={<PrivateLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/products-management" element={<ProductsManagementPage />} />
            <Route path="/services-management" element={<ServicesManagementPage />} />
            <Route path="/videos-management" element={<VideosManagementPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventCommandCenterPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/messages" element={<ChatPage />} />
            <Route path="/workers" element={<WorkersPage />} />
            <Route path="/roles" element={<RolesPermissionsPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
