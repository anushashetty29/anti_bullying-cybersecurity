import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Home from './Home';
import HowItWorks from './HowItWorks';
import Dashboard from './Dashboard';
import Report from './Report';
import Resources from './Resources';
import Statistics from './Statistics';
import Profile from './Profile';
import PublicProfile from './PublicProfile';
import Settings from './Settings';
import Login from './Login';
import AdminLogin from './AdminLogin';
import AdminSetup from './AdminSetup';
import Register from './Register';
import Community from './Community';
import CreateGroup from './CreateGroup';
import GroupPage from './GroupPage';
import Chatbot from './Chatbot';
import JoinGroup from './JoinGroup';
import GroupCreationSuccess from './GroupCreationSuccess';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-wrapper">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <div className="bg-blob bg-blob-3"></div>

        <Routes>
            <Route path="/group/:id" element={null} />
            <Route path="*" element={<Navbar />} />
        </Routes>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/register" element={<Register />} />
            <Route path="/community" element={<Community />} />
            <Route path="/create-group" element={<CreateGroup />} />
            <Route path="/join-group" element={<JoinGroup />} />
            <Route path="/group-creation-success" element={<GroupCreationSuccess />} />
            <Route path="/group/:id" element={<GroupPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/report" element={<Report />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:email" element={<PublicProfile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        <Routes>
            <Route path="/group/:id" element={null} />
            <Route path="*" element={<Chatbot />} />
        </Routes>
        
        <Routes>
            <Route path="/group/:id" element={null} />
            <Route path="*" element={<Footer />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;



