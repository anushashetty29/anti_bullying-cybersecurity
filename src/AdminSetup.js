import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminSetup.css';

function AdminSetup() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('isAdmin', 'true');
        setSuccess('Admin password set successfully. Redirecting...');
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        setError(data.message || 'Failed to set admin password.');
      }
    } catch (err) {
      setError('An error occurred while setting the admin password.');
    }
  };

  return (
    <div className="admin-setup-page">
      <div className="admin-setup-card">
        <h1>Admin Setup</h1>
        <p className="admin-setup-subtitle">Create your admin password to continue.</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter a new password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}
          <button type="submit" className="login-btn">Set Password</button>
        </form>
      </div>
    </div>
  );
}

export default AdminSetup;
