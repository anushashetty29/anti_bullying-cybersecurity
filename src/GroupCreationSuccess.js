import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './GroupCreationSuccess.css';

const GroupCreationSuccess = () => {
    const location = useLocation();
    const groupId = location.state?.groupId;

    return (
        <div className="success-container">
            <div className="success-card">
                <h2>Group Created Successfully!</h2>
                <p>Your new group is ready.</p>
                <div className="success-actions">
                    {groupId && (
                        <Link to={`/group/${groupId}`} className="btn btn-primary">
                            Go to Group
                        </Link>
                    )}
                    <Link to="/community" className="btn btn-secondary">
                        Back to Community
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default GroupCreationSuccess;
