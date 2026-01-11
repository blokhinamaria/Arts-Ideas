import { useState } from 'react';
import { Divide as Hamburger } from 'hamburger-react'

import './header.css'

export default function Header () {

    // const [ isOpen, setIsOpen ] = useState(false);
    

    return (
        <header>
            
            <img className='logo-header' src='/assets/logo/artsideas-full-white.svg'  alt='Arts and Ideas logo'/>

            {/* <Hamburger
                toggled={isOpen} toggle={setIsOpen}
                duration={2}
                aria-controls="main-menu"
                aria-expanded={isOpen}
                aria-label="Toggle menu"
            /> */}

            {/* <nav id="main-menu" className={isOpen ? 'open' : ''}>
                <ul>
                    <li className='desktop-only'><a>Explore by<br/>month</a></li>
                    <li className='desktop-only'><a>Explore by<br/>category</a></li>
                    <li className='desktop-only'><a>Events<br/>Map</a></li>
                    <li className='desktop-only'><a>About</a></li>
                    <li  className='mobile-only'><a onClick={() => setIsOpen(false)}>Explore by month</a></li>
                    <li className='mobile-only'><a onClick={() => setIsOpen(false)}>Explore by category</a></li>
                    <li className='mobile-only'><a onClick={() => setIsOpen(false)}>Events Map</a></li>
                    <li  className='mobile-only'><a onClick={() => setIsOpen(false)}>About</a></li>
                </ul>
            </nav> */}
            
            <div className='presented-by'>
                <small>Presented By</small>
                <p className='body-large'>The University of Tampa</p>
                <p className='body-large'><strong>College of Arts and Letters</strong></p>
            </div>
        </header>
    )
}