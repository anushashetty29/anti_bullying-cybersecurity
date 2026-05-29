import React from 'react';
import './Resources.css';

const RESOURCES = [
  {
    category: 'For Students',
    items: [
      { title: 'How to block and report on every social media platform', link: 'https://cyberbullying.org/report' },
      { title: 'Digital footprints: Why they matter for your future', link: 'https://www.internetsociety.org/tutorials/your-digital-footprint-matters/' },
      { title: 'The "Think Before You Post" checklist', link: 'https://pacerteensagainstbullying.org/advocacy/think-before-you-post/' }
    ]
  },
  {
    category: 'For Parents',
    items: [
      { title: 'Signs your child might be a victim of cyberbullying', link: 'https://www.stopbullying.gov/cyberbullying/prevention' },
      { title: 'How to talk to your child about online safety', link: 'https://www.commonsensemedia.org/articles/online-safety' },
      { title: 'Setting healthy boundaries with technology', link: 'https://childmind.org/article/healthy-limits-on-video-games/' }
    ]
  },
  {
    category: 'Mental Health Support',
    items: [
      { title: 'Coping strategies for online harassment', link: 'https://www.apa.org/topics/bullying/cyberbullying' },
      { title: 'Building resilience in a digital world', link: 'https://www.mcleanhospital.org/essential/cyberbullying' },
      { title: 'Finding professional help: A guide for victims', link: 'https://www.betterhelp.com/advice/bullying/' }
    ]
  }
];

function Resources() {
  return (
    <div className="resources-page">
      <div className="resources-header">
        <p className="section-tag">Education & Support</p>
        <h1>Helpful <span className="highlight">Resources</span></h1>
        <p className="resources-sub">Practical guides and professional advice to help you navigate the digital world safely.</p>
      </div>

      <div className="resources-grid">
        {RESOURCES.map((section, idx) => (
          <div key={idx} className="resource-section">
            <h2>{section.category}</h2>
            <div className="resource-list">
              {section.items.map((item, i) => (
                <div key={i} className="resource-item">
                  <span className="resource-icon">📄</span>
                  <div className="resource-body">
                    <div className="resource-title">{item.title}</div>
                    <a href={item.link} className="resource-link" target="_blank" rel="noopener noreferrer">Read Guide &rarr;</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="helpline-banner">
        <h2>Need immediate help?</h2>
        <p>If you or someone you know is in immediate danger, please contact your local emergency services or a 24/7 crisis helpline.</p>
        <div className="helpline-buttons">
          <button className="btn-primary">International Helplines</button>
          <button className="btn-ghost">Contact School Counsellor</button>
        </div>
      </div>
    </div>
  );
}

export default Resources;
