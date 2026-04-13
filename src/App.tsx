import { useLayoutEffect, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation} from 'react-router-dom';
import './App.css'

//Components
import Layout from './components/Layout.jsx';
import HomePage from './components/HomePage.jsx';
import Styles from './components/layout-components/Styles.jsx'
import CampusMap from './components/content-components/CampusMap'
import SubmitEvent from './components/content-components/SubmitEvent'

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
            </Route>
          </Routes>
        </Wrapper>
      </Router>
    </>
  )
}

export default App
