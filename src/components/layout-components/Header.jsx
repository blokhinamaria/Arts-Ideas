import './header.css'

export default function Header () {
    return (
        <header>
            
            <img className='logo-header' src='public/assets/logo/artsideas-full-white.svg'  alt='Arts and Ideas logo'/>
            
            <nav>
                <a>Explore<br/>by month</a>
                <a>Explore<br/>by category</a>
                <a>Events<br/>Map</a>
                <a>About</a>
            </nav>
            
            <div className='presented-by'>
                <small>Presented By</small>
                <p className='body-large'>The University of Tampa</p>
                <p className='body-large'><strong>College of Arts and Letters</strong></p>
            </div>
        </header>
    )
}