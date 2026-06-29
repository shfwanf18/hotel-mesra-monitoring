import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { AppLayout } from './components/layout/AppLayout'
import { MonitoringProvider } from './context/MonitoringContext'
import App from './App.tsx'
import DeviceManagement from './pages/DeviceManagement.tsx'
import Settings from './pages/Settings.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <MonitoringProvider>
        <AppLayout />
      </MonitoringProvider>
    ),
    children: [
      { path: "/", element: <App /> },
      { path: "/devices", element: <DeviceManagement /> },
      { path: "/settings", element: <Settings /> },
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
