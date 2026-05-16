import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import AppLayout from '@/components/AppLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import PlansPage from '@/pages/PlansPage'
import NewPlanPage from '@/pages/NewPlanPage'
import PlanDetailPage from '@/pages/PlanDetailPage'
import TransfersPage from '@/pages/TransfersPage'
import PeoplePage from '@/pages/PeoplePage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/plans/new" element={<NewPlanPage />} />
            <Route path="/plans/:id" element={<PlanDetailPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
