import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App      from './App.jsx'
import AdminApp from './AdminApp.jsx'

/**
 * Root router:
 *   #/admin  → AdminApp  (platform admin console, restricted)
 *   (other)  → App       (company logistics app)
 *
 * Responds to hashchange so navigating to /#/admin
 * while the app is open switches immediately.
 */
function Root() {
  const [isAdmin, setIsAdmin] = useState(
    window.location.hash.startsWith('#/admin')
  );

  useEffect(() => {
    const handler = () => {
      setIsAdmin(window.location.hash.startsWith('#/admin'));
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return isAdmin ? <AdminApp /> : <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
