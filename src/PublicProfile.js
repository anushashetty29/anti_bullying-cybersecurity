import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './PublicProfile.css';

function PublicProfile() {
  const { email } = useParams();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    // In a real app, you would fetch the user's data from a backend using the email.
    // For now, we'll check if it's the current user's email, otherwise show mock data.
    const currentUserEmail = localStorage.getItem('userEmail') || 'user@example.com';
    
    if (email === currentUserEmail) {
      setProfileData({
        name: localStorage.getItem('userName') || 'User',
        bio: localStorage.getItem('userBio') || 'I am passionate about creating a safer digital space for everyone.',
        joined: '2026',
        groups: 2,
        reports: 0
      });
    } else {
      // Mock data for other users
      setProfileData({
        name: email.split('@')[0],
        bio: 'Dedicated to spreading kindness and support in our community.',
        joined: '2025',
        groups: 5,
        reports: 12
      });
    }
  }, [email]);

  if (!profileData) {
    return <div className="public-profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {profileData.name.charAt(0).toUpperCase()}
          </div>
          <h1>{profileData.name}</h1>
          <p className="profile-email">{email}</p>
          <div className="public-badge">Public Profile</div>
        </div>

        <div className="profile-body">
          <div className="bio-section">
            <div className="section-title-row">
              <h2>About {profileData.name}</h2>
            </div>
            <p className="bio-text">{profileData.bio}</p>
          </div>

          <div className="stats-section">
            <h2>Community Activity</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Groups Joined</h3>
                <span className="stat-value">{profileData.groups}</span>
              </div>
              <div className="stat-card">
                <h3>Reports Submitted</h3>
                <span className="stat-value">{profileData.reports}</span>
              </div>
              <div className="stat-card">
                <h3>Member Since</h3>
                <span className="stat-value">{profileData.joined}</span>
              </div>
            </div>
          </div>
          
          <div className="public-actions">
             <Link to="/community" className="back-to-community-btn">Back to Community</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;
