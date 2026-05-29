import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminLogin.css';

function AdminLogin() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (name === 'anusha29' && password === 'admin') {
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('userName', 'anusha29');
      navigate('/dashboard');
    } else {
      setError('Invalid admin credentials');
      setPassword('');
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>Admin Login</h1>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Admin Name</label>
            <input
              type="text"
              placeholder="Enter admin name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="login-btn">Login</button>
        </form>
        <p className="register-link-from-login">
          Need a user account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
