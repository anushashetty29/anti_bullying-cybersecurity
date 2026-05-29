
import React, { useState, useEffect } from 'react';
import './Profile.css';

function Profile() {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [bio, setBio] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setUserEmail(localStorage.getItem('userEmail') || 'user@example.com');
    setUserName(localStorage.getItem('userName') || 'User');
    setBio(localStorage.getItem('userBio') || 'I am passionate about creating a safer digital space for everyone.');
  }, []);

  const handleSave = () => {
    localStorage.setItem('userName', userName);
    localStorage.setItem('userBio', bio);
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {userName ? userName.charAt(0).toUpperCase() : 'A'}
          </div>
          <h1>{userName}</h1>
          <p className="profile-email">{userEmail}</p>
        </div>

        <div className="profile-body">
          <div className="bio-section">
            <div className="section-title-row">
              <h2>About Me</h2>
              {!isEditing && (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)} 
                    className="profile-input"
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    rows="4"
                    className="profile-input"
                  />
                </div>
                <div className="form-actions">
                  <button className="save-btn" onClick={handleSave}>Save Changes</button>
                  <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <p className="bio-text">{bio}</p>
            )}
          </div>

          <div className="stats-section">
            <h2>My Activity</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Groups Joined</h3>
                <span className="stat-value">2</span>
              </div>
              <div className="stat-card">
                <h3>Reports Submitted</h3>
                <span className="stat-value">0</span>
              </div>
              <div className="stat-card">
                <h3>Member Since</h3>
                <span className="stat-value">2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

