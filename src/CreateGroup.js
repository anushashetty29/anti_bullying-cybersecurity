import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuidelinesModal from './GuidelinesModal';
import './CreateGroup.css';

const CreateGroup = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [groupType, setGroupType] = useState('public');
    const [groupCode, setGroupCode] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const userEmail = localStorage.getItem('userEmail');

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');

        if (!userEmail) {
            alert('You must be logged in to create a group.');
            navigate('/login');
            return;
        }

        if (!name.trim()) {
            setError('Please enter a group name.');
            return;
        }

        if (!description.trim()) {
            setError('Please enter a group description.');
            return;
        }

        if (groupType === 'private' && !groupCode.trim()) {
            setError('Please enter a code for your private group.');
            return;
        }

        const hasAgreed = localStorage.getItem('hasAgreedToGuidelines');
        if (!hasAgreed) {
            setIsModalOpen(true);
            return;
        }

        await submitGroup();
    };

    const submitGroup = async () => {
        setIsLoading(true);
        setError('');

        const newGroup = {
            name: name.trim(),
            description: description.trim(),
            type: groupType,
            code: groupType === 'private' ? groupCode.trim() : null,
        };

        try {
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newGroup),
            });

            if (response.ok) {
                const createdGroup = await response.json();
                navigate('/group-creation-success', { state: { groupId: createdGroup.id, groupName: createdGroup.name } });
            } else {
                const errData = await response.json().catch(() => ({}));
                setError(errData.error || errData.message || 'Failed to create group. Please try again.');
            }
        } catch (err) {
            console.error('Error creating group:', err);
            setError(
                '⚠️ Cannot connect to the server. Make sure the backend is running.\n' +
                'Open a new terminal and run: npm run server'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="create-group-container">
            <form onSubmit={handleCreate} className="create-group-form">
                <h2>Create a New Group</h2>

                {error && (
                    <div className="cg-error-box">
                        <span className="cg-error-icon">⚠️</span>
                        <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
                    </div>
                )}

                <div className="input-group">
                    <label htmlFor="group-name">Group Name</label>
                    <input
                        type="text"
                        id="group-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Support Circle"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="group-description">Group Description</label>
                    <textarea
                        id="group-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What is this group about?"
                        required
                        disabled={isLoading}
                    ></textarea>
                </div>

                <div className="group-type-selector">
                    <label>
                        <input
                            type="radio"
                            value="public"
                            checked={groupType === 'public'}
                            onChange={() => setGroupType('public')}
                            disabled={isLoading}
                        />
                        Public
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="private"
                            checked={groupType === 'private'}
                            onChange={() => setGroupType('private')}
                            disabled={isLoading}
                        />
                        Private
                    </label>
                </div>

                {groupType === 'private' && (
                    <div className="input-group private-code-input">
                        <label htmlFor="group-code">Group Code</label>
                        <input
                            type="text"
                            id="group-code"
                            placeholder="Create a secret code for your private group"
                            value={groupCode}
                            onChange={(e) => setGroupCode(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                )}

                <button type="submit" className="submit-btn" disabled={isLoading}>
                    {isLoading ? '⏳ Creating...' : '✦ Create Group'}
                </button>

                {!localStorage.getItem('userEmail') && (
                    <p className="cg-login-hint">
                        You must be <a href="/login">logged in</a> to create a group.
                    </p>
                )}
            </form>

            <GuidelinesModal
                isOpen={isModalOpen}
                onAgree={() => {
                    setIsModalOpen(false);
                    submitGroup();
                }}
                onDecline={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default CreateGroup;
