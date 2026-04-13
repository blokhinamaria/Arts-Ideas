import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Divide as Hamburger } from 'hamburger-react'

import './header.css'

export default function Header () {

    const [ isOpen, setIsOpen ] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) setIsOpen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    return (
        <header>
            <h1 className="visually-hidden">Arts and Ideas</h1>

            <Link to="/"><img className='logo-header' src='/assets/logo/artsideas-full-white.svg'  alt='Arts and Ideas logo'/></Link>

            {/* <Hamburger
                toggled={isOpen} toggle={setIsOpen}
                duration={0.4}
                aria-controls="main-menu"
                aria-expanded={isOpen}
                aria-label="Toggle menu"
            /> */}

            {/* <nav id="main-menu" aria-label="Main navigation" className={isOpen ? 'open' : ''}>
                <ul>
                    <li className='desktop-only'><a>Explore by<br/>month</a></li>
                    <li className='desktop-only'><a>Explore by<br/>category</a></li>
                    <li className='desktop-only'><Link to="/campus-map">Campus<br/>Map</Link></li>
                    <li className='desktop-only'><button>About</button></li>
                    <li  className='mobile-only'><a onClick={() => setIsOpen(false)}>Explore by month</a></li>
                    <li className='mobile-only'><a onClick={() => setIsOpen(false)}>Explore by category</a></li>
                    <li className='mobile-only'><Link to="/campus-map" onClick={() => setIsOpen(false)}>Campus Map</Link></li>
                    <li className='mobile-only'><button onClick={() => setIsOpen(false)}>About</button></li>
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
