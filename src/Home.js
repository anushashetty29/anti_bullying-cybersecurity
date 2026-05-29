import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const FEATURES = [
  { icon: '🔍', title: 'AI Pattern Detection', desc: 'NLP models scan messages and posts to detect harassment, threats, and repeated targeting before serious damage is done.', color: 'rgba(233,69,96,0.12)' },
  { icon: '⚡', title: 'Real-Time Alerts', desc: 'Parents, teachers, and counsellors receive instant notifications when harmful behaviour is detected.', color: 'rgba(0,180,216,0.12)' },
  { icon: '💚', title: 'Support First Module', desc: 'When problematic content is flagged, users see the emotional impact of their words — encouraging self-reflection.', color: 'rgba(6,214,160,0.12)' },
  { icon: '🛡️', title: 'Safe Reporting', desc: "Anonymous, judgment-free incident reporting that protects the victim's identity while ensuring every case is addressed.", color: 'rgba(255,183,3,0.12)' },
  { icon: '🤝', title: 'Value-Based Counselling', desc: "We don't just punish — we reform. Guided by Universal Human Values, our counselling helps bullies restore empathy.", color: 'rgba(255,107,157,0.12)' },
  { icon: '📊', title: 'Admin Dashboard', desc: 'School coordinators get a unified dashboard with incident tracking, severity scoring, and intervention status.', color: 'rgba(167,139,250,0.12)' },
];

const VALUES = [
  { emoji: '🌟', title: 'Self-Respect', desc: "Every person deserves to live with dignity. We restore it when it's attacked online." },
  { emoji: '🤝', title: 'Empathy', desc: 'The bully fails to feel another\'s pain. We guide them back to shared humanity.' },
  { emoji: '🔍', title: 'Trust', desc: 'Safe spaces must stay safe. We rebuild the trust that cyberbullying breaks.' },
  { emoji: '💛', title: 'Care', desc: 'Someone always notices. Our platform ensures no victim is ever invisible.' },
  { emoji: '☮️', title: 'Harmony', desc: 'Fear and anxiety replace peace. We intervene early so harmony can return.' },
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.classList.add('visible');
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = '' }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

function Home() {
  const userName = localStorage.getItem('userName');
  const isLoggedIn = localStorage.getItem('userEmail') || localStorage.getItem('isAdmin');
  
  return (
    <div className="home">

      {/* --- HERO --- */}
      <section className="hero">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          Safeguarding Detection Platform
        </div>
        {(isLoggedIn && userName) && <h2 className="greeting">Hi <span className="user-name-highlight">{userName}</span> 👋</h2>}
        <h1>Stop Cyberbullying<br /><span className="highlight">Before It Scars</span></h1>
        <p className="hero-sub">
          An early-intervention platform combining smart detection, real-time alerts,
          and value-based counselling to protect every child's dignity online.
        </p>
        
        {!userName && !localStorage.getItem('isAdmin') && (
          <div className="hero-actions">
            <Link to="/register" className="btn-primary">New Registration</Link>
            <Link to="/login" className="btn-ghost">Login</Link>
            <Link to="/admin-login" className="btn-ghost btn-admin">Admin Login</Link>
          </div>
        )}
        
        {(userName || localStorage.getItem('isAdmin')) && (
          <div className="hero-actions">
            <Link to={localStorage.getItem('isAdmin') ? '/dashboard' : '/community'} className="btn-primary">
              Continue to {localStorage.getItem('isAdmin') ? 'Dashboard' : 'Community'}
            </Link>
          </div>
        )}

        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-num">1 in <span>3</span></div>
            <div className="stat-label">Young people are cyberbullied</div>
          </div>
          <div className="stat-item">
            <div className="stat-num"><span>87</span>%</div>
            <div className="stat-label">Cases go unreported</div>
          </div>
          <div className="stat-item">
            <div className="stat-num"><span>2min</span></div>
            <div className="stat-label">Average response time</div>
          </div>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section className="section" id="features">
        <RevealSection>
          <p className="section-tag">What We Do</p>
          <h2>Detect. Alert. Heal.</h2>
          <p className="section-desc">Our platform monitors harmful patterns and connects victims with support — immediately.</p>
        </RevealSection>
        <RevealSection className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon" style={{ background: f.color }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </RevealSection>
      </section>

      {/* --- VALUES --- */}
      <section className="section" id="values">
        <RevealSection style={{ textAlign: 'center' }}>
          <p className="section-tag">Universal Human Values</p>
          <h2>Built on What Makes Us Human</h2>
          <p className="section-desc" style={{ margin: '0 auto 3rem' }}>
            Cyberbullying is a human values problem. Every feature we build restores what it takes away.
          </p>
        </RevealSection>
        <RevealSection className="values-grid">
          {VALUES.map((v, i) => (
            <div className="value-card" key={i}>
              <div className="v-emoji">{v.emoji}</div>
              <h4>{v.title}</h4>
              <p>{v.desc}</p>
            </div>
          ))}
        </RevealSection>
      </section>

      {/* --- FOOTER --- */}
      <footer className="footer">
        <div className="footer-brand">Cyber<span>Shield</span></div>
        <p>Built with empathy · Universal Human Values Project</p>
        <p className="footer-copy">© 2025 CyberShield Platform | <Link to="/admin-login" style={{color: 'inherit', textDecoration: 'underline'}}>Admin Access</Link></p>
      </footer>
    </div>
  );
}

export default Home;
