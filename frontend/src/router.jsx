import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from './App.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Residents from './pages/Residents.jsx'
import AccessLogs from './pages/AccessLogs.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'

function Guard({ children }) {
  return localStorage.getItem('access_token') ? children : <Navigate to="/login" replace />
}

export default createBrowserRouter([
  { path:'/login', element:<Login/> },
  {
    path:'/',
    element:<Guard><App/></Guard>,
    children:[
      { index:true,            element:<Dashboard/> },
      { path:'logs',           element:<AccessLogs/> },
      { path:'residents',      element:<Residents/> },
      { path:'settings',       element:<Settings/> },
    ]
  },
  { path:'*', element:<Navigate to="/" replace/> },
])
