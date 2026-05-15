import React, { useState, useEffect } from 'react';
import './Chat.css';

const ChatList = ({ currentUser, onSelectChat }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchChats();
        // Poll for new messages every 10 seconds
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchChats = async () => {
        try {
            const response = await fetch(`http://32.198.132.159:5000/api/users/${currentUser.id}/chats`);
            const data = await response.json();
            if (data.success) {
                setChats(data.chats);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredChats = chats.filter(chat => {
        const otherUser = chat.participants.find(p => p._id !== currentUser.id);
        return otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        return date.toLocaleDateString();
    };

    return (
        <div className="chat-list-container">
            <div className="chat-list-header">
                <h2>Messages</h2>
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Loading conversations...</div>
            ) : filteredChats.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <h3>No messages yet</h3>
                    <p>Start a conversation when you accept a swap request</p>
                </div>
            ) : (
                <div className="chat-items">
                    {filteredChats.map(chat => {
                        const otherUser = chat.participants.find(p => p._id !== currentUser.id);
                        const lastMessage = chat.lastMessage?.content || 'No messages yet';
                        const time = chat.lastMessage ? formatTime(chat.lastMessage.createdAt) : formatTime(chat.updatedAt);
                        
                        return (
                            <div
                                key={chat._id}
                                className={`chat-item ${chat.unreadCount > 0 ? 'unread' : ''}`}
                                onClick={() => onSelectChat(chat)}
                            >
                                <div className="chat-avatar">
                                    {otherUser?.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="chat-info">
                                    <div className="chat-name-row">
                                        <span className="chat-name">{otherUser?.name}</span>
                                        <span className="chat-time">{time}</span>
                                    </div>
                                    <div className="chat-last-message">
                                        {lastMessage.length > 40 
                                            ? `${lastMessage.substring(0, 40)}...` 
                                            : lastMessage}
                                    </div>
                                    {chat.swapRequestId && (
                                        <div className="chat-skill">
                                            🎯 {chat.swapRequestId.proposedSkills?.join(', ')}
                                        </div>
                                    )}
                                </div>
                                {chat.unreadCount > 0 && (
                                    <div className="unread-badge">{chat.unreadCount}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ChatList;
