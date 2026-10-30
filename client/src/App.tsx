import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router'
import StaffPage from './pages/StaffPage'
import ProjectsPage from './pages/ProjectsPage'
import CvPage from './pages/CvPage'

export default function App() {
  return (
    <BrowserRouter>
      <header className="topbar">
        <strong>CV Generator</strong>
        <nav>
          <NavLink to="/staff">Staff</NavLink>
          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/cv">Generate CV</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/staff" replace />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/cv" element={<CvPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
