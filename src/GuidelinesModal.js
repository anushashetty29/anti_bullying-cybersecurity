import React, { useState, useEffect } from 'react';
import './GuidelinesModal.css';

const GUIDELINES = [
    { icon: '🚫', text: 'No cyberbullying, harassment or hate speech' },
    { icon: '🔗', text: 'No sharing links to illegal or harmful websites' },
    { icon: '⚠️', text: 'No personal attacks or threats against anyone' },
    { icon: '🔞', text: 'No inappropriate or adult content' },
    { icon: '📢', text: 'No spamming or sending repeated messages' },
    { icon: '🤝', text: 'Treat all members with respect' },
    { icon: '❄️', text: 'Breaking any rule will result in your account being frozen for 30 minutes and you will be notified', bold: true },
];

const GuidelinesModal = ({ isOpen, onAgree, onDecline }) => {
    const [isChecked, setIsChecked] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsChecked(false); // reset checkbox every time modal opens
            setTimeout(() => setVisible(true), 10);
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAgree = () => {
        if (isChecked) {
            localStorage.setItem('hasAgreedToGuidelines', 'true');
            onAgree();
        }
    };

    const handleDecline = () => {
        setVisible(false);
        setTimeout(onDecline, 200);
    };

    return (
        <div className={`gm-overlay ${visible ? 'gm-visible' : ''}`}>
            <div className={`gm-card ${visible ? 'gm-card-visible' : ''}`}>
                {/* Header */}
                <div className="gm-header">
                    <div className="gm-shield-icon">🛡️</div>
                    <h2 className="gm-title">Community Guidelines</h2>
                    <p className="gm-subtitle">Please read and agree before continuing</p>
                </div>

                {/* Rules */}
                <div className="gm-rules">
                    {GUIDELINES.map((rule, index) => (
                        <div key={index} className={`gm-rule ${rule.bold ? 'gm-rule-warning' : ''}`}>
                            <span className="gm-rule-num">{index + 1}</span>
                            <span className="gm-rule-icon">{rule.icon}</span>
                            <span className={`gm-rule-text ${rule.bold ? 'gm-bold' : ''}`}>{rule.text}</span>
                        </div>
                    ))}
                </div>

                {/* Checkbox */}
                <label className="gm-checkbox-label">
                    <input
                        type="checkbox"
                        className="gm-checkbox-input"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        id="gm-agree-checkbox"
                    />
                    <span className="gm-custom-checkbox">{isChecked ? '✓' : ''}</span>
                    <span className="gm-checkbox-text">I have read and agree to the terms and conditions</span>
                </label>

                {/* Buttons */}
                <div className="gm-actions">
                    <button className="gm-cancel-btn" onClick={handleDecline}>
                        ✕ Cancel
                    </button>
                    <button
                        className={`gm-agree-btn ${isChecked ? 'gm-agree-active' : ''}`}
                        disabled={!isChecked}
                        onClick={handleAgree}
                    >
                        ✓ Agree & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuidelinesModal;