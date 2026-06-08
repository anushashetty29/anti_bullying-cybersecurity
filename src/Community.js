import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GuidelinesModal from './GuidelinesModal';
import './Community.css';

const Community = () => {
    const [groups, setGroups] = useState([]);
    const [guidelinesModalOpen, setGuidelinesModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await fetch('/api/groups');
                const data = await response.json();
                setGroups(data);
            } catch (error) {
                console.error('Error fetching groups:', error);
            }
        };
        fetchGroups();
    }, []);

    const handleGroupAction = (action) => {
        // Always show guidelines modal before any group action
        setPendingAction(() => action);
        setGuidelinesModalOpen(true);
    };

    const handleModalAgree = () => {
        setGuidelinesModalOpen(false);
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    const handleModalDecline = () => {
        setGuidelinesModalOpen(false);
        setPendingAction(null);
    };

    const handleJoinGroup = (group) => {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            alert('You must be logged in to join a group.');
            navigate('/login');
            return;
        }

        handleGroupAction(() => {
            if (group.type === 'private') {
                const code = prompt('This is a private group. Please enter the group code:');
                if (code) {
                    verifyGroupCode(group.id, code, userEmail);
                }
            } else {
                navigate(`/group/${group.id}`);
            }
        });
    };

    const verifyGroupCode = async (id, code, email) => {
        try {
            const response = await fetch(`/api/groups/${id}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, email }),
            });
            const result = await response.json();
            if (result.success) {
                navigate(`/group/${id}`);
            } else {
                alert('Invalid group code.');
            }
        } catch (error) {
            console.error('Error verifying code:', error);
        }
    };

    return (
        <div className="community-container">
            <div className="community-header">
                <h1>Community</h1>
                <p>Connect with others, share your story, and find support.</p>
                <div className="community-actions">
                    <button onClick={() => {
                        if (!localStorage.getItem('userEmail')) {
                            alert('You must be logged in to create a group.');
                            navigate('/login');
                        } else {
                            handleGroupAction(() => navigate('/create-group'));
                        }
                    }} className="create-group-btn">Create New Group</button>
                    <button onClick={() => {
                        if (!localStorage.getItem('userEmail')) {
                            alert('You must be logged in to join a group.');
                            navigate('/login');
                        } else {
                            handleGroupAction(() => navigate('/join-group'));
                        }
                    }} className="join-group-btn">Join with Code</button>
                </div>
            </div>
            <div className="groups-list">
                {groups.map(group => (
                    <div key={group.id} className="group-card">
                        <div className={`group-type-badge ${group.type}`}>{group.type}</div>
                        <h2>{group.name}</h2>
                        <p>{group.description}</p>
                        <button onClick={() => handleJoinGroup(group)} className="view-group-btn">
                            {group.type === 'private' ? 'Join Group' : 'Join / View Group'}
                        </button>
                    </div>
                ))}
            </div>
            
            <GuidelinesModal 
                isOpen={guidelinesModalOpen} 
                onAgree={handleModalAgree} 
                onDecline={handleModalDecline} 
            />
        </div>
    );
};

export default Community;
