import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const BOT_RESPONSES = {
  bully: "I'm sorry you're experiencing this. You can report the incident anonymously using the Report page. A counsellor will respond within 2 minutes. 💙",
  report: "Go to the Report page (link in the navbar). It's secure and anonymous. You're not alone.",
  help: "You can report an incident, check how our platform works, or talk to a counsellor. What do you need?",
  parent: "Parents and teachers receive instant alerts when harmful behaviour is detected. You can also report directly.",
  default: [
    "I understand. You're not alone. Would you like to go to the report form?",
    "Thank you for sharing. Our counsellors are here to help. 💙",
    "That sounds really difficult. Would you like to report this incident securely?"
  ]
};

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi 👋 I'm your CyberShield assistant. Are you experiencing cyberbullying, or do you need help reporting an incident?" }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getReply = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('bully') || lower.includes('harass') || lower.includes('threat')) return BOT_RESPONSES.bully;
    if (lower.includes('report')) return BOT_RESPONSES.report;
    if (lower.includes('help') || lower.includes('support')) return BOT_RESPONSES.help;
    if (lower.includes('parent') || lower.includes('teacher') || lower.includes('counsel')) return BOT_RESPONSES.parent;
    const arr = BOT_RESPONSES.default;
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text: getReply(userMsg.text) }]);
    }, 700);
  };

  return (
    <>
      <button className="chat-toggle" onClick={() => setOpen(!open)} aria-label="Open chat">
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-avatar">🛡️</div>
            <div>
              <div className="chat-name">CyberShield Support</div>
              <div className="chat-status">● Online · Here to help</div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.from}`}>{msg.text}</div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              type="text"
              value={input}
              placeholder="Type a message..."
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button className="chat-send" onClick={sendMessage}>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
