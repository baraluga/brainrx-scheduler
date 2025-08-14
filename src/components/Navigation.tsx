import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/students', label: 'Students' },
  { path: '/trainers', label: 'Trainers' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/insights', label: 'Insights' },
]

function Navigation() {
  const location = useLocation()

  return (
    <nav className="flex space-x-8">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default Navigation