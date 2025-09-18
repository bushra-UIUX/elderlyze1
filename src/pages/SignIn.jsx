import React, { useState } from 'react';
import '../Assets/Css/SignIn.css';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Assets/Images/Logo.png';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Firebase/firebase';

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 👈 track password visibility
  const [loading, setLoading] = useState(false);

  return (
    <main className="auth">
      <div className="container">
        <div className="auth-card">
          <img src={Logo} alt="Elderlyze" className="auth-logo" />
          <h1>Welcome Back</h1>
          <p className="auth-sub">Sign in to continue your journey with Elderlyze</p>

          <form className="auth-form" onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              setLoading(true);
              if (!email.trim() || !password) {
                setError('Enter email and password');
                setLoading(false);
                return;
              }
              await signInWithEmailAndPassword(auth, email.trim(), password);
              navigate('/app');
            } catch (err) {
              setError(err.message || 'Failed to sign in');
            } finally {
              setLoading(false);
            }
          }}>
            <label htmlFor="email">Email Address</label>
            <input 
              id="email" 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e)=>setEmail(e.target.value)} 
              required 
            />

            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input 
                id="password" 
                type={showPassword ? "text" : "password"}  // 👈 toggle type
                placeholder="Enter your password" 
                value={password} 
                onChange={(e)=>setPassword(e.target.value)} 
                required 
              />
              <span 
                className="eye" 
                role="button" 
                tabIndex={0} 
                onClick={() => setShowPassword(!showPassword)} 
              >
                {showPassword ? "🙈" : "👁️"}   {/* 👈 change icon */}
              </span>
            </div>

            {error && <div className="error-text" role="alert">{error}</div>}

            <div className="auth-row">
              <label className="checkbox">
                <input type="checkbox" /> Remember me
              </label>
              <Link className="link" to="/forgot-password">Forgot password?</Link>
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>

          <p className="auth-alt">Don't have an account? <Link to="/signup">Sign up here</Link></p>
        </div>
      </div>
    </main>
  );
}

export default SignIn;
