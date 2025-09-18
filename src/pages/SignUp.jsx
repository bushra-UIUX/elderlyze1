import React, { useState } from 'react';
import '../Assets/Css/SignUp.css';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Assets/Images/Logo.png'
import { createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../Firebase/firebase";


function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const nextFieldErrors = {};
    if (!name.trim()) nextFieldErrors.name = 'Full name is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) nextFieldErrors.email = 'Enter a valid email';
    if (password.length < 6) nextFieldErrors.password = 'Password must be at least 6 characters';
    if (password !== confirm) nextFieldErrors.confirm = 'Passwords do not match';
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) return;
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
      }
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name.trim(),
        email: user.email,
        createdAt: serverTimestamp()
      });
      // Ensure navbar stays logged-out until explicit sign-in
      await signOut(auth);
      alert('Account created successfully. Please sign in to continue.');
      navigate('/signin');
    } catch (err) {
      const code = err && err.code ? String(err.code) : '';
      if (code === 'auth/invalid-email') {
        setFieldErrors({ email: 'Please enter a valid email address' });
        setError('');
      } else if (code === 'auth/email-already-in-use') {
        setFieldErrors({ email: 'This email is already in use' });
        setError('');
      } else if (code === 'auth/weak-password') {
        setFieldErrors({ password: 'Password is too weak' });
        setError('');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="auth">
      <div className="container">
        <div className="auth-card">
          <img src={Logo} alt="Elderlyze" className="auth-logo" />
          <h1>Create your account</h1>
          <p className="auth-sub">Join Elderlyze for wellness, companionship, and safety</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" placeholder="Enter your full name" value={name} onChange={(e)=>setName(e.target.value)} required aria-invalid={!!fieldErrors.name} />
            {fieldErrors.name && <div className="error-text" role="alert">{fieldErrors.name}</div>}

            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e)=>setEmail(e.target.value)} required aria-invalid={!!fieldErrors.email} />
            {fieldErrors.email && <div className="error-text" role="alert">{fieldErrors.email}</div>}

            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={password} onChange={(e)=>setPassword(e.target.value)} required aria-invalid={!!fieldErrors.password} />
              <span className="eye" role="button" tabIndex={0} onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</span>
            </div>
            {fieldErrors.password && <div className="error-text" role="alert">{fieldErrors.password}</div>}

            <label htmlFor="confirm">Confirm Password</label>
            <div className="input-with-icon">
              <input id="confirm" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter your password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} required aria-invalid={!!fieldErrors.confirm} />
              <span className="eye" role="button" tabIndex={0} onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? '🙈' : '👁️'}</span>
            </div>
            {fieldErrors.confirm && <div className="error-text" role="alert">{fieldErrors.confirm}</div>}

            {error && <div className="error-text" role="alert">{error}</div>}

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Sign Up'}</button>
          </form>

          <p className="auth-alt">Already have an account? <Link to="/signin">Sign in</Link></p>
        </div>
      </div>
    </main>
  );
}

export default SignUp;


