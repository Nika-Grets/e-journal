// Точка входа в приложение: маршрутизация и защита роутов.
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar        from './components/layout/Sidebar';
import Dashboard      from './pages/Dashboard/index';
import TeacherJournal from './pages/TeacherJournal';
import Login          from './pages/Login';
import UsersPage      from './pages/UsersPage';
import TopicsPage     from './pages/Topics';
import SchedulePage   from './pages/Schedule/index';
import AdminPage      from './pages/Admin';
import ReportsPage    from './pages/Reports';
import SubjectsPage   from './pages/Subjects';
import GradesPage     from './pages/Grades';
import { can, canManageSchedule } from './utils/auth';
import { NoAccess } from './components/ui/PermGuard';

// БАГ-ФИX: оборачиваем роуты, требующие прав, чтобы прямой переход по URL
// не давал доступ пользователям без нужного разрешения.
function ProtectedRoute({ check, children }) {
  return check() ? children : <NoAccess/>;
}

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      {isAuthenticated ? (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
          <Sidebar/>
          <main style={{ flex: 1, overflow: 'auto' }}>
            <Routes>
              <Route path="/"         element={<Dashboard/>}/>
              <Route path="/schedule" element={<SchedulePage/>}/>

              {/* Журнал — только для учителей (не для администратора) */}
              <Route path="/journal" element={
                <ProtectedRoute check={() => can('grades:write') && !canManageSchedule()}>
                  <TeacherJournal/>
                </ProtectedRoute>
              }/>

              <Route path="/grades"   element={<GradesPage/>}/>
              <Route path="/planning" element={<TopicsPage/>}/>
              <Route path="/reports"  element={<ReportsPage/>}/>

              {/* Разделы только для администратора */}
              <Route path="/users"    element={
                <ProtectedRoute check={() => can('users:manage')}>
                  <UsersPage/>
                </ProtectedRoute>
              }/>
              <Route path="/subjects" element={
                <ProtectedRoute check={() => can('users:manage')}>
                  <SubjectsPage/>
                </ProtectedRoute>
              }/>
              <Route path="/admin"    element={
                <ProtectedRoute check={() => can('users:manage')}>
                  <AdminPage/>
                </ProtectedRoute>
              }/>

              <Route path="/login" element={<Navigate to="/"/>}/>
              <Route path="*"      element={<Navigate to="/"/>}/>
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login/>}/>
          <Route path="*"      element={<Navigate to="/login"/>}/>
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
