import React, { useState, useEffect } from 'react'
import Login from './components/auth/login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard' // Import admin dashboard
import './styles/App.css'

function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('login')
  const [isLoading, setIsLoading] = useState(true)

  // Check localStorage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('skillswap_user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setCurrentPage('dashboard')
      } catch (error) {
        console.error('Failed to parse saved user:', error)
        localStorage.removeItem('skillswap_user')
      }
    }
    setIsLoading(false)
  }, [])

  // Reset scroll position when page changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    })
    document.body.style.overflow = 'auto'
  }, [currentPage])

  const handleLogin = (userData) => {
    localStorage.setItem('skillswap_user', JSON.stringify(userData))
    setUser(userData)
    setCurrentPage('dashboard')
    window.scrollTo(0, 0)
  }

  const handleLogout = () => {
    localStorage.removeItem('skillswap_user')
    setUser(null)
    setCurrentPage('login')
    window.scrollTo(0, 0)
  }

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="App" style={{
        backgroundImage: 'url(/images/robo2.jpg)',
        backgroundColor: '#f0f8ff',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px'
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '30px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          🔄 Loading SkillSwap...
        </div>
      </div>
    )
  }

  return (
    <div 
      className="App" 
      style={{
        background: `
          linear-gradient(rgba(255, 255, 255, 0.20), rgba(255, 255, 255, 0.30)),
          url(/images/robo.jpg)
        `,
        backgroundColor: '#f0f8ff',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto'
      }}
    >
      {currentPage === 'login' && <Login onLogin={handleLogin} />}
      {currentPage === 'dashboard' && user && (
        // Check if user is admin
        user.role === 'admin' ? (
          <AdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} />
        )
      )}
    </div>
  )
}

export default App