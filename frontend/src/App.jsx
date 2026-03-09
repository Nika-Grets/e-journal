
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar       from './components/layout/Sidebar';
import Dashboard     from './pages/Dashboard/index';
import TeacherJournal from './pages/TeacherJournal';
import Login         from './pages/Login';
import UsersPage     from './pages/UsersPage';
import TopicsPage    from './pages/Topics';
import SchedulePage  from './pages/Schedule/index';
import AdminPage     from './pages/Admin';
import ReportsPage   from './pages/Reports';
import SubjectsPage  from './pages/Subjects';
import GradesPage    from './pages/Grades';

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
              <Route path="/journal"  element={<TeacherJournal/>}/>
              <Route path="/users"    element={<UsersPage/>}/>
              <Route path="/planning" element={<TopicsPage/>}/>
              <Route path="/schedule" element={<SchedulePage/>}/>
              <Route path="/admin"    element={<AdminPage/>}/>
              <Route path="/reports"  element={<ReportsPage/>}/>
              <Route path="/subjects" element={<SubjectsPage/>}/>
              <Route path="/grades"   element={<GradesPage/>}/>
              <Route path="/login"    element={<Navigate to="/"/>}/>
              <Route path="*"         element={<Navigate to="/"/>}/>
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