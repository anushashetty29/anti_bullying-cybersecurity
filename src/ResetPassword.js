import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './ResetPassword.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
        setError('Reset token is missing. Please request a new password reset link.');
        return;
    }

    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
    }

    setLoading(true);

    try {
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
        });

        const data = await response.json();

        if (response.ok) {
            setMessage(data.message || 'Your password has been successfully reset.');
        } else {
            setError(data.message || 'Failed to reset password. The link may have expired or is invalid.');
        }
    } catch (error) {
        setError('An error occurred. Please check your connection.');
        console.error('Reset password error:', error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        <h1>Reset Password</h1>

        {!token ? (
          <div className="error-container">
            <div className="error-icon">❌</div>
            <p className="error-msg">Invalid or missing reset token. Please request a new password reset link.</p>
            <Link to="/forgot-password" className="request-link-btn">Request Reset Link</Link>
          </div>
        ) : message ? (
          <div className="success-container">
            <div className="success-icon">✔️</div>
            <p className="success-message-text">{message}</p>
            <Link to="/login" className="back-to-login-btn">Go to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword}>
            <p className="description">
              Please enter and confirm your new password below.
            </p>
            <div className="input-group">
              <label>New Password</label>
              <div className="password-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="At least 6 characters..." 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span onClick={() => setShowPassword(!showPassword)} className="password-toggle-icon">
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </div>
            </div>
            <div className="input-group">
              <label>Confirm Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Confirm your password..." 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="reset-submit-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
