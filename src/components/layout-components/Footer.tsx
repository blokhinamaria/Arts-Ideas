import './footer.css'

export default function Footer() {
    return (
        <footer>
            <div className='footer-group-one'>
                <img className='logo-footer' src='/assets/logo/artsideas-full-white.svg'  alt='Arts and Ideas logo'/>
                {/* <form id='email-signup-form'>
                    <p className="label">Subscribe to our newsletter</p>
                    <label htmlFor='email'><small>Add your email</small></label>
                    <input id='email' type='email' name='email' placeholder='Email' />
                    <button type='submit'>Subscribe</button>
                </form> */}
            </div>
            <p className="label">2025 ©university of tampa</p>
        </footer>
    )
}
