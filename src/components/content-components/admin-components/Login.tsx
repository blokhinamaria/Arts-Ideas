import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export default function Login() {

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });

    const [ invalidEmail, setInvalidEmail ] = useState<boolean>(false)
    const [ errorMessage, setErrorMessage ] = useState('');

    const [ authInProgress, setAuthInProgress] = useState(false);

    const navigate = useNavigate()
    const { login } = useAuth()

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.name === 'email') setInvalidEmail(false)
        setFormData({
        ...formData,
        [e.target.name]: e.target.value
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage('')
        if (!formData.username || !formData.password) {
            setErrorMessage('Invalid credentials')
            return
        }
        
            // if (formData.email) {
        //     const isValid = isEmailValid(formData.email);
        //     if (!isValid) {
        //         setErrorMessage('Please enter valid UTampa admin email')
        //         return
        //     }
        // } else if (formData.email === '') {
        //     setErrorMessage('Please enter valid UTampa admin email')
        //     return
        // } else {
        //     setErrorMessage('Invalid email')
        //     return
        // }
        setAuthInProgress(true)
        
        try {
            const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : ''
            const response:Response = await fetch(`${API_BASE_URL}/auth/login`, {
                credentials: 'include',
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                setErrorMessage(data.error || data.message || 'Login Failed. Check your credentials and try again')
                return
            }
            
            await login();
            navigate("/admin-dashboard");
            
        } catch (err) {
            setErrorMessage('Something went wrong. Please try again later')
        } finally {
            setAuthInProgress(false)
        }
    }

    function isEmailValid(email:string) {
        const regex = /^[A-Za-z0-9._%+-]+@(ut\.edu|spartans\.ut\.edu)$/;
        const result = regex.test(email);
            if(!result) {
                setErrorMessage('Email is not valid. Please, enter valid UTampa admin email');
                setInvalidEmail(true)
                return false;
            } else {
                setInvalidEmail(false)
                return true;
            }
    }

    return (
            <article id='login'>
                <h1>Admin Login</h1>
                    <form id='login' onSubmit={handleSubmit}>
                        <label htmlFor='username'>Username</label>
                        <input
                            aria-label='username'
                            aria-required={true}
                            type='text'
                            id='username'
                            name='username'
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className={invalidEmail ? 'invalid' : ''}
                            >
                        </input>
                        <label htmlFor='password'>Password</label>
                        <input
                            aria-label='password'
                            aria-required={true}
                            type='password'
                            id='password'
                            name='password'
                            value={formData.password}
                            onChange={handleChange}
                            required
                            >
                        </input>
                        { errorMessage ? <p aria-live='polite' className='error-message'>{errorMessage}</p> : null}
                        <button type='submit' disabled={authInProgress}>{!authInProgress ? 'Login' : 'Loggin in...'}</button>
                    </form>
            </article>
    )
}