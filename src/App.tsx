import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import StudentManagement from './pages/StudentManagement'
import Trainers from './pages/Trainers'
import Calendar from './pages/Calendar'
import PublicDailyView from './pages/PublicDailyView'
import Insights from './pages/Insights'

function App() {
  const PrivateRoutes = () => (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/trainers" element={<Trainers />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/insights" element={<Insights />} />
      </Routes>
    </Layout>
  )
  return (
    <Router>
      <Routes>
        <Route path="/live" element={<PublicDailyView />} />
        <Route path="/*" element={<PrivateRoutes />} />
      </Routes>
    </Router>
  )
}

export default App