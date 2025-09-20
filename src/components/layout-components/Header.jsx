import { useState } from 'react';
import { Divide as Hamburger } from 'hamburger-react'

import './header.css'

export default function Header () {

    const [ isOpen, setIsOpen ] = useState(false);
    

    return (
        <header>
            
            <img className='logo-header' src='public/assets/logo/artsideas-full-white.svg'  alt='Arts and Ideas logo'/>
            
            {/* <button className={`hamburger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-controls="main-menu"
                aria-expanded={isOpen}
                aria-label="Toggle menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button> */}

            <Hamburger
                // className='hamburger'
                // onClick={() => setIsOpen(!isOpen)}
                toggled={isOpen} toggle={setIsOpen}
                duration={2}
                aria-controls="main-menu"
                aria-expanded={isOpen}
                aria-label="Toggle menu"
            />

            <nav id="main-menu" className={isOpen ? 'open' : ''}>
                <ul>
                    <li className='desktop'><a>Explore<br/>by month</a></li>
                    <li className='desktop'><a>Explore<br/>by category</a></li>
                    <li className='desktop'><a>Events<br/>Map</a></li>
                    <li className='desktop'><a>About</a></li>
                    <li  className='mobile'><a onClick={() => setIsOpen(false)}>Explore by month</a></li>
                    <li className='mobile'><a onClick={() => setIsOpen(false)}>Explore by category</a></li>
                    <li className='mobile'><a onClick={() => setIsOpen(false)}>Events Map</a></li>
                    <li  className='mobile'><a onClick={() => setIsOpen(false)}>About</a></li>
                </ul>
            </nav>
            
            <div className='presented-by'>
                <small>Presented By</small>
                <p className='body-large'>The University of Tampa</p>
                <p className='body-large'><strong>College of Arts and Letters</strong></p>
            </div>
        </header>
    )
}