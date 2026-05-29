import React from 'react';
import './HowItWorks.css';

const STEPS = [
  { num: '01', icon: '📡', title: 'Monitor', desc: 'The system continuously scans digital spaces for patterns of harassment, threats, and exclusion using advanced detection algorithms trained on cyberbullying datasets.' },
  { num: '02', icon: '🧠', title: 'Analyse', desc: 'Smart analysis classifies severity — High, Medium, or Low — and identifies the exact type of bullying behaviour: threats, humiliation, exclusion, impersonation, or hate speech.' },
  { num: '03', icon: '🚨', title: 'Alert', desc: 'Trusted adults — parents, teachers, counsellors — are instantly notified with context, evidence, and a suggested response plan tailored to the severity.' },
  { num: '04', icon: '🤝', title: 'Intervene', desc: 'Counsellors step in with value-based guidance rooted in Universal Human Values. We support the victim and guide the bully toward empathy and genuine reform — not just punishment.' },
  { num: '05', icon: '🌱', title: 'Heal', desc: 'Both the victim and bully receive ongoing support. The platform tracks recovery progress and measures empathy growth over time using reflection questionnaires.' },
];

function HowItWorks() {
  return (
    <div className="how-page">
      <div className="how-header">
        <p className="section-tag">Process</p>
        <h1>From Detection<br /><span className="highlight">to Healing</span></h1>
        <p className="how-sub">A five-step process that doesn't just stop harm — it restores human values and rebuilds dignity.</p>
      </div>

      <div className="steps-list">
        {STEPS.map((step, i) => (
          <div className="step-item" key={i}>
            <div className="step-left">
              <div className="step-num">{step.num}</div>
              {i < STEPS.length - 1 && <div className="step-line"></div>}
            </div>
            <div className="step-card">
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="methodology">
        <p className="section-tag">Methodology</p>
        <h2>Research-Backed Approach</h2>
        <div className="method-grid">
          <div className="method-card">
            <h4>Literature Review</h4>
            <p>Existing research on cyberbullying causes, forms, and psychological impact — including real-life case studies from schools and colleges worldwide.</p>
          </div>
          <div className="method-card">
            <h4>Primary Survey</h4>
            <p>Questionnaire-based study among students and young professionals to understand real experiences of cyberbullying and what stops reporting.</p>
          </div>
          <div className="method-card">
            <h4>UHV Mapping</h4>
            <p>Each form of cyberbullying is mapped to the Universal Human Values it violates — self-respect, trust, empathy, care, and harmony.</p>
          </div>
          <div className="method-card">
            <h4>Platform Design</h4>
            <p>Advanced detection combined with a value-based counselling module — technology as a tool for human restoration, not just enforcement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;
