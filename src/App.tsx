import { useLayoutEffect, ReactNode, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation} from 'react-router-dom';
import './App.css'

//Components
import Layout from './components/Layout.jsx';
import HomePage from './components/HomePage.jsx';
import Styles from './components/layout-components/Styles.jsx'
const CampusMap = lazy(() => import('./components/content-components/CampusMap'));
const SubmitEvent = lazy(() => import('./components/content-components/SubmitEvent'));
import { AuthProvider } from './context/AuthContext.js';

const Login = lazy(() => import('./components/content-components/admin-components/Login.js'));
const AdminDashboard = lazy(() => import('./components/content-components/admin-components/AdminDashboard.js'));

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
              <Route path='/campus-map' element={<Suspense><CampusMap /></Suspense>}/>
              <Route path='/submit-event' element={<Suspense><SubmitEvent /></Suspense>}/>
              <Route element={<AuthLayout />}>
                <Route path='/login' element={<Suspense><Login /></Suspense>} />
                <Route path='/admin-dashboard' element={<Suspense><AdminDashboard /></Suspense>} />
              </Route>
            </Route>
          </Routes>
        </Wrapper>
      </Router>
    </>
  )
}

export default App
