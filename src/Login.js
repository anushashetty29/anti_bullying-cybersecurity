import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.isAdmin) {
            localStorage.setItem('isAdmin', 'true');
            navigate('/dashboard');
          } else {
            localStorage.setItem('userEmail', email);
            if (data.name) localStorage.setItem('userName', data.name);
            navigate('/');
          }
        } else {
          setError(data.message || 'Login failed');
        }
    } catch (error) {
        setError('An error occurred during login.');
        console.error('Login error:', error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="Enter your email..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password..." 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <span onClick={() => setShowPassword(!showPassword)} className="password-toggle-icon">
                {showPassword ? 'Hide' : 'Show'}
              </span>
            </div>
          </div>
          <div className="forgot-password-container">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="login-btn">Login</button>
        </form>
        <p className="register-link-from-login">
            Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
