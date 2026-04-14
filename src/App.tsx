import { useLayoutEffect, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation} from 'react-router-dom';
import './App.css'

//Components
import Layout from './components/Layout.jsx';
import HomePage from './components/HomePage.jsx';
import Styles from './components/layout-components/Styles.jsx'
import CampusMap from './components/content-components/CampusMap'
import SubmitEvent from './components/content-components/SubmitEvent'
import Login from './components/content-components/admin-components/Login.js';
import { AuthProvider } from './context/AuthContext.js';
import AdminDashboard from './components/content-components/admin-components/AdminDashboard.js';

function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

function App() {

  const Wrapper = ({children}: {children: ReactNode}) => {  
      //Scroll to the top of the page when the route changes
        const location = useLocation();

        useLayoutEffect(() => {
          window.scrollTo( {top: 0, left: 0, behavior: 'instant'})
        }, [location.pathname]);
      return children;
    }

  return (
    <>
      <Router>
        <Wrapper>
          <Routes>
            <Route path='/' element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path='/styles' element={<Styles />}/>
              <Route path='/campus-map' element={<CampusMap />}/>
              <Route path='/submit-event' element={<SubmitEvent />}/>
              <Route element={<AuthLayout />}>
                <Route path='/login' element={<Login />} />
                <Route path='/admin-dashboard' element={<AdminDashboard />} />
              </Route>
            </Route>
          </Routes>
        </Wrapper>
      </Router>
    </>
  )
}

export default App
