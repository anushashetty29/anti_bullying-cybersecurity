import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);

    // Check login status
    const user = localStorage.getItem('userEmail');
    const admin = localStorage.getItem('isAdmin');
    const name = localStorage.getItem('userName');
    if (user || admin) {
        setIsLoggedIn(true);
        setUserEmail(user);
        setUserName(name || '');
    } else {
        setIsLoggedIn(false);
        setUserEmail(null);
        setUserName(null);
    }

    return () => window.removeEventListener('scroll', onScroll);
  }, [location]); // Rerun on location change

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    setUserEmail(null);
    setUserName(null);
    setProfileMenuOpen(false);
    navigate('/login');
  };

  const handleShareProfile = () => {
    const profileUrl = window.location.origin + '/user/' + userEmail; // Example URL
    navigator.clipboard.writeText(profileUrl).then(() => {
        alert('Profile link copied to clipboard!');
    }, () => {
        alert('Failed to copy profile link.');
    });
    setProfileMenuOpen(false);
};

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Community', path: '/community' },
    { label: 'Statistics', path: '/statistics' },
    { label: 'Resources', path: '/resources' },
  ];

  const authLinks = [
    { label: 'Login', path: '/login' },
    { label: 'Register', path: '/register' },
    { label: 'Admin Login', path: '/admin-login' },
  ];

  // Hide Navbar when rendering the GroupPage chat layout
  if (location.pathname.startsWith('/group/')) {
      return null;
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="nav-logo">
        Cyber<span>Shield</span>
      </Link>

      <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
        {navLinks.map(link => (
          <li key={link.path}>
            <Link
              to={link.path}
              className={location.pathname === link.path ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          </li>
        ))}
        {isLoggedIn ? (
            <>
                <li className={`profile-menu-container ${profileMenuOpen ? 'active' : ''}`}>
                    <div className="profile-icon-wrapper" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                        <div className="profile-icon">
                            {userName ? userName.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : 'A')}
                        </div>
                        <svg className={`chevron ${profileMenuOpen ? 'open' : ''}`} viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>

                    {profileMenuOpen && (
                        <div className="profile-dropdown-card">
                            <div className="dropdown-header">
                                <div className="dropdown-avatar">{userName ? userName.charAt(0).toUpperCase() : 'A'}</div>
                                <div className="dropdown-user-info">
                                    <p className="dropdown-name">{userName || 'User'}</p>
                                    <p className="dropdown-email">{userEmail || 'admin@cybershield.com'}</p>
                                </div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-body">
                                <Link to="/profile" className="dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    My Profile
                                </Link>
                                <button className="dropdown-item" onClick={handleShareProfile}>
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                    Share Profile
                                </button>
                                <Link to="/create-group" className="dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    Groups & Community
                                </Link>
                                <Link to="/settings" className="dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                    Account Settings
                                </Link>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-footer">
                                <button className="dropdown-item logout-item" onClick={handleLogout}>
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </li>
            </>
        ) : (
            authLinks.map(link => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={location.pathname === link.path ? 'active' : ''}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))
        )}
      </ul>

      <Link to={isLoggedIn ? "/report" : "/login"} className="nav-cta" onClick={() => setMenuOpen(false)}>
        Report Incident
      </Link>

      <button
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span></span><span></span><span></span>
      </button>
    </nav>
  );
}

export default Navbar;
