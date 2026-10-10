import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PublicLayout from './components/PublicLayout';
import PrivateLayout from './components/PrivateLayout';

// Public Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

// Auth Page
import LoginPage from './pages/LoginPage';

// Private Dashboard Pages
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import FinancePage from './pages/FinancePage';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import ProductsManagementPage from './pages/ProductsManagementPage';
import ServicesManagementPage from './pages/ServicesManagementPage';
import CategoriesPage from './pages/CategoriesPage';
import EventsPage from './pages/EventsPage';
import EventCommandCenterPage from './pages/EventCommandCenterPage';
import TasksPage from './pages/TasksPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ChatPage from './pages/ChatPage';
import WorkersPage from './pages/WorkersPage';
import RolesPermissionsPage from './pages/RolesPermissionsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogPage from './pages/AuditLogPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import { ToastContainer } from './utils/toast';

export default function App() {
  return (
    <AuthProvider>
      <ToastContainer />
      <Routes>
        {/* PUBLIC CUSTOMER-FACING WEBSITE */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
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
    </AuthProvider>
  );
}
