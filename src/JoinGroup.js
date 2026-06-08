import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuidelinesModal from './GuidelinesModal';
import './JoinGroup.css';

const JoinGroup = () => {
    const [code, setCode] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const userEmail = localStorage.getItem('userEmail');

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!userEmail) {
            alert('You must be logged in to join a group.');
            navigate('/login');
            return;
        }
        if (!code) {
            alert('Please enter a group code.');
            return;
        }

        const hasAgreed = localStorage.getItem('hasAgreedToGuidelines');
        if (!hasAgreed) {
            setIsModalOpen(true);
            return;
        }

        await submitJoin();
    };

    const submitJoin = async () => {
        try {
            const response = await fetch('/api/join-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, email: userEmail }),
            });

            const data = await response.json();

            if (response.ok) {
                navigate(`/group/${data.groupId}`);
            } else {
                alert(data.message || 'Failed to join group.');
            }
        } catch (error) {
            console.error('Error joining group:', error);
            alert('An error occurred while trying to join the group.');
        }
    };

    return (
        <div className="join-group-container">
            <div className="join-group-card">
                <h2>Join a Private Group</h2>
                <form onSubmit={handleJoin}>
                    <div className="input-group">
                        <label htmlFor="group-code">Group Code</label>
                        <input
                            type="text"
                            id="group-code"
                            placeholder="Enter the group code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="join-btn">Join Group</button>
                </form>
            </div>

            <GuidelinesModal 
                isOpen={isModalOpen} 
                onAgree={() => {
                    setIsModalOpen(false);
                    submitJoin();
                }} 
                onDecline={() => setIsModalOpen(false)} 
            />
        </div>
    );
};

export default JoinGroup;
