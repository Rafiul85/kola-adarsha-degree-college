import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { PublicLayout } from './components/layout/PublicLayout'
import { AuthLayout } from './components/layout/AuthLayout'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { RequireAuth, RequireRole } from './components/layout/Guards'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Teachers = lazy(() => import('./pages/Teachers'))
const TeacherProfile = lazy(() => import('./pages/TeacherProfile'))
const Students = lazy(() => import('./pages/Students'))
const Results = lazy(() => import('./pages/Results'))
const Academics = lazy(() => import('./pages/Academics'))
const Admission = lazy(() => import('./pages/Admission'))
const Notices = lazy(() => import('./pages/Notices'))
const NoticeDetail = lazy(() => import('./pages/NoticeDetail'))
const Events = lazy(() => import('./pages/Events'))
const Contact = lazy(() => import('./pages/Contact'))
const Faq = lazy(() => import('./pages/Faq'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Login = lazy(() => import('./pages/Login'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'))
const AccountPage = lazy(() => import('./pages/dashboard/AccountPage'))
const AdminNotices = lazy(() => import('./pages/dashboard/AdminNotices'))
const AdminEvents = lazy(() => import('./pages/dashboard/AdminEvents'))
const AdminTeachers = lazy(() => import('./pages/dashboard/AdminTeachers'))
const AdminStudents = lazy(() => import('./pages/dashboard/AdminStudents'))
const AdminResults = lazy(() => import('./pages/dashboard/AdminResults'))
const AdminAcademics = lazy(() => import('./pages/dashboard/AdminAcademics'))
const AdminDocuments = lazy(() => import('./pages/dashboard/AdminDocuments'))
const AdminMessages = lazy(() => import('./pages/dashboard/AdminMessages'))
const AdminUsers = lazy(() => import('./pages/dashboard/AdminUsers'))
const AdminSettings = lazy(() => import('./pages/dashboard/AdminSettings'))
const AdminAudit = lazy(() => import('./pages/dashboard/AdminAudit'))

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-pine-600 dark:text-pine-300" aria-hidden="true" />
        <p className="text-sm text-slate-500 dark:text-slate-400">লোড হচ্ছে…</p>
      </div>
    </div>
  )
}

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="teachers/:id" element={<TeacherProfile />} />
          <Route path="students" element={<Students />} />
          <Route path="results" element={<Results />} />
          <Route path="academics" element={<Academics />} />
          <Route path="admission" element={<Admission />} />
          <Route path="notices" element={<Notices />} />
          <Route path="notices/:id" element={<NoticeDetail />} />
          <Route path="events" element={<Events />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<Faq />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        <Route path="dashboard" element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="notices" element={<RequireRole roles={['admin']}><AdminNotices /></RequireRole>} />
            <Route path="events" element={<RequireRole roles={['admin']}><AdminEvents /></RequireRole>} />
            <Route path="teachers" element={<RequireRole roles={['admin']}><AdminTeachers /></RequireRole>} />
            <Route path="students" element={<RequireRole roles={['admin']}><AdminStudents /></RequireRole>} />
            <Route path="results" element={<RequireRole roles={['admin']}><AdminResults /></RequireRole>} />
            <Route path="academics" element={<RequireRole roles={['admin']}><AdminAcademics /></RequireRole>} />
            <Route path="documents" element={<RequireRole roles={['admin']}><AdminDocuments /></RequireRole>} />
            <Route path="messages" element={<RequireRole roles={['admin']}><AdminMessages /></RequireRole>} />
            <Route path="users" element={<RequireRole roles={['admin']}><AdminUsers /></RequireRole>} />
            <Route path="settings" element={<RequireRole roles={['admin']}><AdminSettings /></RequireRole>} />
            <Route path="audit" element={<RequireRole roles={['admin']}><AdminAudit /></RequireRole>} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
