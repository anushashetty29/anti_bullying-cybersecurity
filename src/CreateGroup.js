import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateGroup.css';

const CreateGroup = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [groupType, setGroupType] = useState('public');
    const [groupCode, setGroupCode] = useState('');
    const navigate = useNavigate();

    const handleCreate = async (e) => {
        e.preventDefault();
        const newGroup = {
            name,
            description,
            type: groupType,
            code: groupType === 'private' ? groupCode : null,
        };

        try {
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newGroup),
            });
            if (response.ok) {
                const createdGroup = await response.json();
                navigate('/group-creation-success', { state: { groupId: createdGroup.id } });
            } else {
                console.error('Failed to create group');
            }
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    return (
        <div className="create-group-container">
            <form onSubmit={handleCreate} className="create-group-form">
                <h2>Create a New Group</h2>
                <div className="input-group">
                    <label htmlFor="group-name">Group Name</label>
                    <input
                        type="text"
                        id="group-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="group-description">Group Description</label>
                    <textarea
                        id="group-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    ></textarea>
                </div>
                <div className="group-type-selector">
                    <label>
                        <input
                            type="radio"
                            value="public"
                            checked={groupType === 'public'}
                            onChange={() => setGroupType('public')}
                        />
                        Public
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="private"
                            checked={groupType === 'private'}
                            onChange={() => setGroupType('private')}
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
                            placeholder="Create a code for your private group"
                            value={groupCode}
                            onChange={(e) => setGroupCode(e.target.value)}
                            required
                        />
                    </div>
                )}
                <button type="submit" className="submit-btn">Create Group</button>
            </form>
        </div>
    );
};

export default CreateGroup;
