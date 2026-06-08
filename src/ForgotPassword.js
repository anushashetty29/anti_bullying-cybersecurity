import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            setMessage(data.message || 'Check your inbox for a reset link.');
        } else {
            setError(data.message || 'Something went wrong. Please try again.');
        }
    } catch (error) {
        setError('An error occurred. Please check your connection.');
        console.error('Forgot password error:', error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <h1>Forgot Password</h1>
        
        {message ? (
          <div className="success-container">
            <div className="success-icon">✉️</div>
            <p className="success-message-text">{message}</p>
            <Link to="/login" className="back-to-login-btn">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <p className="description">
              Enter your email address below and we'll send you a secure link to reset your password.
            </p>
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="reset-submit-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="back-link">
              <Link to="/login">Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
