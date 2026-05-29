import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Report.css';

const PLATFORMS = ['Instagram','WhatsApp','Discord','Snapchat','Facebook','Twitter / X','TikTok','Gaming Platform','Other'];
const TYPES = ['Threatening Messages','Public Humiliation','Exclusion / Isolation','Impersonation','Hate Speech','Sharing Private Content','Other'];
const SEVERITIES = [
  { label: '🟡 Low', value: 'Low' },
  { label: '🟡  Medium', value: 'Medium' },
  { label: '🔴 High', value: 'High' },
];

function Report() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('userEmail');
    const admin = localStorage.getItem('isAdmin');
    if (!user && !admin) {
      navigate('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  const [form, setForm] = useState({ 
    name: '', email: '', platform: '', type: '', severity: '', description: '', anonymous: false,
    trustedContactName: '', trustedContactEmail: '' 
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.platform) e.platform = 'Please select a platform.';
    if (!form.type) e.type = 'Please select the type of bullying.';
    if (!form.severity) e.severity = 'Please select severity.';
    if (!form.description.trim()) e.description = 'Please describe what happened.';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Please enter a valid email address.';
    if (form.trustedContactEmail && !/\S+@\S+\.\S+/.test(form.trustedContactEmail)) e.trustedContactEmail = 'Please enter a valid email address for the trusted contact.';
    return e;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    
    // Send email via the backend
    try {
        await fetch('/api/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
    } catch (err) {
        console.error('Failed to send email:', err);
    }
    


    setSubmitted(true);
  };

  const handleReset = () => {
    setForm({ name: '', email: '', platform: '', type: '', severity: '', description: '', anonymous: false, trustedContactName: '', trustedContactEmail: '' });
    setErrors({});
    setSubmitted(false);
  };

  if (!isAuthenticated) return null; // Prevent rendering if not logged in

  if (submitted) {
    return (
      <div className="report-page">
        <div className="success-box">
          <div className="success-icon">✅</div>
          <h2>Report Submitted</h2>
          <p>Thank you for reaching out. Your report has been recorded securely. <b>We will help you recover</b> and take the necessary steps to ensure your safety. Stay strong — support is on the way.</p>
          <button className="btn-primary" onClick={handleReset}>Submit Another Report</button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="report-layout">

        {/* Left info panel */}
        <div className="report-info">
          <p className="section-tag">Safe Reporting</p>
          <h1>Your Voice<br /><span className="highlight">Matters Here</span></h1>
          <p className="report-sub">Every report is handled with care and confidentiality. You don't have to face this alone.</p>
          <ul className="report-perks">
            <li><span className="check">✓</span> Anonymous reporting option available</li>
            <li><span className="check">✓</span> Counsellor notified within 2 minutes</li>
            <li><span className="check">✓</span> Follow-up support always provided</li>
            <li><span className="check">✓</span> All data is kept strictly confidential</li>
          </ul>
        </div>

        {/* Form card */}
        <div className="report-card">
          <h3>Report an Incident</h3>
          <form onSubmit={handleSubmit} noValidate>

              <div className="form-group flex-group">
                <div style={{ flex: 1 }}>
                  <label>Your Name <span className="optional">(optional)</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Anonymous"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Your Email <span className="optional">(for recovery/support)</span></label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="example@mail.com"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                  {errors.email && <div className="error">{errors.email}</div>}
                </div>
              </div>

            <div className="form-group">
              <label>Platform Where It Happened</label>
              <select className={`form-control ${errors.platform ? 'error' : ''}`} value={form.platform} onChange={e => handleChange('platform', e.target.value)}>
                <option value="">Select platform...</option>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
              {errors.platform && <span className="err-msg">{errors.platform}</span>}
            </div>

            <div className="form-group">
              <label>Type of Bullying</label>
              <select className={`form-control ${errors.type ? 'error' : ''}`} value={form.type} onChange={e => handleChange('type', e.target.value)}>
                <option value="">Select type...</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              {errors.type && <span className="err-msg">{errors.type}</span>}
            </div>

            <div className="form-group">
              <label>Severity</label>
              <div className="severity-row">
                {SEVERITIES.map(s => (
                  <button
                    type="button"
                    key={s.value}
                    className={`sev-btn ${form.severity === s.value ? 'active' : ''}`}
                    onClick={() => handleChange('severity', s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {errors.severity && <span className="err-msg">{errors.severity}</span>}
            </div>

            <div className="form-group">
              <label>Describe What Happened</label>
              <textarea
                className={`form-control ${errors.description ? 'error' : ''}`}
                placeholder="Tell us what you experienced or witnessed..."
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                rows={4}
              />
              {errors.description && <span className="err-msg">{errors.description}</span>}
            </div>

            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="anon"
                checked={form.anonymous}
                onChange={e => handleChange('anonymous', e.target.checked)}
              />
              <label htmlFor="anon">Keep my identity anonymous</label>
            </div>

            <hr style={{ margin: '20px 0', border: '1px solid #eee' }} />
            <h4>Trusted Adult Contact (Optional)</h4>
            <p className="trusted-text" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
              Add a parent, teacher, or counsellor. We will instantly notify them with context, evidence, and a suggested response plan tailored to your situation.
            </p>
            <div className="form-group flex-group">
                <div style={{ flex: 1 }}>
                  <label>Trusted Adult Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Mr. Smith"
                    value={form.trustedContactName}
                    onChange={(e) => handleChange('trustedContactName', e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Adult Email</label>
                  <input
                    type="email"
                    className={`form-control ${errors.trustedContactEmail ? 'error' : ''}`}
                    placeholder="adult@mail.com"
                    value={form.trustedContactEmail}
                    onChange={(e) => handleChange('trustedContactEmail', e.target.value)}
                  />
                  {errors.trustedContactEmail && <span className="err-msg">{errors.trustedContactEmail}</span>}
                </div>
              </div>

            <button type="submit" className="submit-btn" style={{marginTop: '20px'}}>Submit Report Securely 🔒</button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Report;

