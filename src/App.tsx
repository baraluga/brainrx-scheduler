import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ProgramManagement from './pages/ProgramManagement'
import Students from './pages/Students'
import Trainers from './pages/Trainers'
import Calendar from './pages/Calendar'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/programs" element={<ProgramManagement />} />
          <Route path="/students" element={<Students />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App