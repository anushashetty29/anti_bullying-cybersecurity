import React, { useState } from 'react';
import './Settings.css';

function Settings() {
  const [activeTab, setActiveTab] = useState('account');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(false);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    alert('Password updated successfully!');
    setOldPassword('');
    setNewPassword('');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      alert('Account deleted.');
      // Add logic here to clear localStorage and redirect to /
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Account Settings</h1>
        
        <div className="settings-layout">
          <div className="settings-sidebar">
            <button 
              className={activeTab === 'account' ? "tab-btn active" : "tab-btn"} 
              onClick={() => setActiveTab('account')}
            >Security & Account</button>
            <button 
              className={activeTab === 'notifications' ? "tab-btn active" : "tab-btn"} 
              onClick={() => setActiveTab('notifications')}
            >Notifications</button>
            <button 
              className={activeTab === 'privacy' ? "tab-btn active" : "tab-btn"} 
              onClick={() => setActiveTab('privacy')}
            >Privacy</button>
          </div>

          <div className="settings-content">
            {activeTab === 'account' && (
              <div className="tab-section">
                <h2>Security Settings</h2>
                <div className="settings-card">
                  <h3>Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="password-form">
                    <div className="form-group">
                      <label>Current Password</label>
                      <input 
                        type="password" 
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="settings-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="settings-input"
                        required
                      />
                    </div>
                    <button type="submit" className="primary-btn">Update Password</button>
                  </form>
                </div>

                <div className="settings-card danger-zone">
                  <h3>Danger Zone</h3>
                  <p>Once you delete your account, there is no going back. Please be certain.</p>
                  <button onClick={handleDeleteAccount} className="danger-btn">Delete Account</button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="tab-section">
                <h2>Notification Preferences</h2>
                <div className="settings-card">
                  <div className="toggle-group">
                    <div className="toggle-info">
                      <h3>Email Notifications</h3>
                      <p>Receive updates about reports and group activity via email.</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={notifyEmail} 
                        onChange={() => setNotifyEmail(!notifyEmail)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="toggle-group">
                    <div className="toggle-info">
                      <h3>Push Notifications</h3>
                      <p>Send an alert when a community moderator replies to you.</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={notifyPush} 
                        onChange={() => setNotifyPush(!notifyPush)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="tab-section">
                <h2>Privacy Options</h2>
                <div className="settings-card">
                  <p className="privacy-note">Control who can see your profile and activity. By default, your reporting activity is strictly anonymous even to group members.</p>
                  <div className="toggle-group">
                    <div className="toggle-info">
                      <h3>Public Profile</h3>
                      <p>Allow other users to see your basic profile info.</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
