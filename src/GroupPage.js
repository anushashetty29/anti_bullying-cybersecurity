import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './GroupPage.css';

const socket = io('');

const GroupPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [groupName, setGroupName] = useState('');
    const [posts, setPosts] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [members, setMembers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showMembers, setShowMembers] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const postsContainerRef = useRef(null);
    const userEmail = localStorage.getItem('userEmail');

    const handleLeaveGroup = async () => {
        try {
            const response = await fetch('/api/groups/' + id + '/leave', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userEmail }),
            });
            if (response.ok) {
                alert('Left group successfully');
                navigate('/community');
            } else {
                alert('Failed to leave group');
            }
        } catch (error) {
            console.error('Error leaving group:', error);
        }
    };

    const handleDeleteGroup = async () => {
        if (window.confirm('Are you sure you want to completely delete this group?')) {
            try {
                const response = await fetch('/api/groups/' + id, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    alert('Group deleted');
                    navigate('/community');
                } else {
                    alert('Failed to delete group');
                }
            } catch (error) {
                console.error('Error deleting group:', error);
            }
        }
    };

    useEffect(() => {
        // Join the group room
        const userName = localStorage.getItem('userName');
        socket.emit('join_group', { groupId: id, userEmail, userName });

        const fetchGroupData = async () => {
            try {
                const response = await fetch('/api/groups/' + id);
                if (response.ok) {
                    const data = await response.json();
                    setGroupName(data.name);
                    setPosts(data.posts);
                } else {
                    console.error('Group not found');
                }
            } catch (error) {
                console.error('Error fetching group data:', error);
            }
        };
        fetchGroupData();

        const fetchMembers = async () => {
            try {
                const response = await fetch('/api/groups/' + id + '/members');
                if (response.ok) {
                    const data = await response.json();
                    setMembers(data);
                }
            } catch (error) {
                console.error('Error fetching members:', error);
            }
        };
        fetchMembers();

        socket.on('receive_message', (data) => {
            const formattedPost = {
                id: data.id,
                author_email: data.author,
                author_name: data.author_name,
                content: data.content,
                timestamp: data.timestamp
            };
            setPosts((prevPosts) => [...prevPosts, formattedPost]);
        });

        // Listen for online users updates
        socket.on('update_online_users', (onlineUserObjects) => {
            setOnlineUsers(onlineUserObjects);
        });

        return () => {
            socket.off('receive_message');
            socket.off('update_online_users');
        };
    }, [id, userEmail]);

    useEffect(() => {
        if (postsContainerRef.current) {
            postsContainerRef.current.scrollTop = postsContainerRef.current.scrollHeight;
        }
    }, [posts]);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const userName = localStorage.getItem('userName');
            const messageData = {
                group: id,
                author: userEmail || 'Anonymous',
                author_name: userName || (userEmail ? userEmail.split('@')[0] : 'Anonymous'),
                content: newMessage,
            };
            socket.emit('send_message', messageData);
            setNewMessage('');
        }
    };

    return (
        <div className="group-page-container">
            <div className="group-header">
                <div className="group-header-info">
                    <button className="chat-back-btn" onClick={() => navigate(-1)} aria-label="Go Back">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
                        </svg>
                    </button>
                    <div className="group-avatar">
                        {groupName ? groupName.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div className="group-title-status">
                        <h1>{groupName}</h1>
                        <span className="online-status">
                            <span className="online-dot"></span> 
                            {onlineUsers.length} Online
                        </span>
                    </div>
                </div>
                <div className="header-actions">
                    <div className="members-dropdown">
                        <button onClick={() => setShowMembers(!showMembers)} className="members-btn" aria-label="Group Members">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ marginRight: '8px' }}>
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path>
                            </svg>
                            View Group Members
                        </button>
                        {showMembers && (
                            <div className="members-list">
                                <h3>Participants</h3>
                                <ul>
                                    {(() => {
                                        const allUsersMap = new Map();
                                        members.forEach(m => allUsersMap.set(m.email, { ...m, isOnline: false }));
                                        onlineUsers.forEach(u => allUsersMap.set(u.email, { ...u, isOnline: true }));
                                        return Array.from(allUsersMap.values()).map((member, index) => {
                                            const displayName = member.name || (member.email ? member.email.split('@')[0] : 'Anonymous');
                                            return (
                                            <li key={index} className={member.isOnline ? "member-online" : ""}>
                                                <div className="member-avatar relative-avatar">
                                                    {displayName.charAt(0).toUpperCase()}
                                                    {member.isOnline && <span className="status-badge"></span>}
                                                </div>
                                                <span>{displayName}</span>
                                                {member.isOnline && <span className="online-text-label">Online</span>}
                                            </li>
                                            );
                                        });
                                    })()}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="settings-dropdown">
                        <button onClick={() => setShowSettings(!showSettings)} className="settings-btn" aria-label="Group Settings">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.73 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"></path>
                            </svg>
                        </button>
                        {showSettings && (
                            <div className="settings-menu">
                                <button onClick={handleLeaveGroup} className="leave-btn">Leave Group</button>
                                <button onClick={handleDeleteGroup} className="delete-btn">Delete Group</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="posts-container" ref={postsContainerRef}>
                {posts.length === 0 ? (
                    <div className="empty-chat">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    posts.map((post, index) => {
                        const isMyMessage = post.author_email === userEmail;
                        return (
                            <div key={index} className={"post-wrapper " + (isMyMessage ? 'my-wrapper' : 'other-wrapper')}>
                                {!isMyMessage && (
                                    <div className="chat-avatar">
                                        {(post.author_name || post.author_email || 'A').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className={"post-card " + (isMyMessage ? 'my-message' : 'other-message')}>
                                    {!isMyMessage && <p className="post-author">{post.author_name || (post.author_email ? post.author_email.split('@')[0] : 'Anonymous')}</p>}
                                    <p className="post-content">{post.content}</p>
                                    <span className="post-time">
                                        {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <div className="new-post-form">
                <textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />
                <button onClick={handleSendMessage} aria-label="Send">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default GroupPage;
