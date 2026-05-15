import React, { useState, useEffect } from 'react';
import Profile from '../components/profile/Profile';
import SkillMatching from '../components/matching/SkillMatching';
import CreditSystem from '../components/credits/CreditSystem';
import UserManagement from '../components/admin/UserManagement';
import SwapRequests from '../components/Requests/SwapRequests';
import Messages from '../pages/Messages';
import ReviewList from '../components/reviews/ReviewList';

const Dashboard = ({ user, onLogout }) => {
    const [activeModule, setActiveModule] = useState('overview');
    const [isMobile, setIsMobile] = useState(false);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const modules = [
        { id: 'profile', title: 'User Profile', description: 'Manage your skills', color: '#007bff', icon: '👤' },
        { id: 'matching', title: 'Skill Matching', description: 'Find partners', color: '#28a745', icon: '🔍' },
        { id: 'requests', title: 'Swap Requests', description: 'View requests', color: '#17a2b8', icon: '📩' },
        { id: 'credits', title: 'Credit System', description: 'Earn credits', color: '#ffc107', icon: '💰' },
        { id: 'chat', title: 'Chat & Schedule', description: 'Communicate', color: '#dc3545', icon: '💬' },
        { id: 'reviews', title: 'Reviews', description: 'See feedback', color: '#6f42c1', icon: '⭐' }
    ];

    if (isAdmin) {
        modules.push({ id: 'admin', title: 'Admin Panel', description: 'Manage users', color: '#fd7e14', icon: '👑' });
    }

    const renderModule = () => {
        switch (activeModule) {
            case 'profile': return <Profile user={user} />;
            case 'matching': return <SkillMatching user={user} />;
            case 'requests': return <SwapRequests user={user} />;
            case 'credits': return <CreditSystem user={user} />;
            case 'admin': return <UserManagement currentUser={user} />;
            case 'chat': return <Messages user={user} onBack={() => setActiveModule('overview')} />;
            case 'reviews': return <ReviewList currentUser={user} />;
            default:
                return (
                    <>
                        {/* Welcome Banner - User ka naam aur email */}
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            padding: isMobile ? '15px' : '20px',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '24px', color: 'white' }}>
                                👋 Welcome, {user.name || 'User'}!
                            </h2>
                            <p style={{ margin: '5px 0 0', fontSize: isMobile ? '12px' : '14px', color: 'rgba(255,255,255,0.8)' }}>
                                {user.email}
                            </p>
                        </div>

                        {/* Stats Cards - User ki personal details */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: isMobile ? '8px' : '15px',
                            marginBottom: '25px'
                        }}>
                            <div style={{
                                background: 'white',
                                padding: isMobile ? '10px' : '15px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ fontSize: isMobile ? '20px' : '24px' }}>💰</div>
                                <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 'bold', color: '#28a745' }}>{user.skillCredits || 0}</div>
                                <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#666' }}>Credits</div>
                            </div>
                            <div style={{
                                background: 'white',
                                padding: isMobile ? '10px' : '15px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ fontSize: isMobile ? '20px' : '24px' }}>⭐</div>
                                <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 'bold', color: '#ffc107' }}>{user.reputationScore || 0}</div>
                                <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#666' }}>Reputation</div>
                            </div>
                            <div style={{
                                background: 'white',
                                padding: isMobile ? '10px' : '15px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ fontSize: isMobile ? '20px' : '24px' }}>🎯</div>
                                <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 'bold', color: '#007bff' }}>{user.teachSkills?.length || 0}</div>
                                <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#666' }}>Can Teach</div>
                            </div>
                            <div style={{
                                background: 'white',
                                padding: isMobile ? '10px' : '15px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ fontSize: isMobile ? '20px' : '24px' }}>📚</div>
                                <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 'bold', color: '#dc3545' }}>{user.learnSkills?.length || 0}</div>
                                <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#666' }}>Want to Learn</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            marginBottom: '25px'
                        }}>
                            <button 
                                onClick={() => setActiveModule('requests')}
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                                    color: 'white',
                                    border: 'none',
                                    padding: isMobile ? '10px' : '12px',
                                    borderRadius: '8px',
                                    fontSize: isMobile ? '13px' : '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                📩 View Swap Requests
                            </button>
                            <button 
                                onClick={onLogout}
                                style={{
                                    flex: 1,
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    padding: isMobile ? '10px' : '12px',
                                    borderRadius: '8px',
                                    fontSize: isMobile ? '13px' : '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                🚪 Logout
                            </button>
                        </div>

                        {/* Modules Section Heading */}
                        <div style={{
                            marginBottom: '12px',
                            borderBottom: '2px solid #e0e0e0',
                            paddingBottom: '8px'
                        }}>
                            <h3 style={{ margin: 0, fontSize: isMobile ? '14px' : '16px', color: '#333' }}>
                                📱 Explore Features
                            </h3>
                        </div>

                        {/* Modules Grid - 2 per row on mobile */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                            gap: isMobile ? '10px' : '20px'
                        }}>
                            {modules.map(module => (
                                <div 
                                    key={module.id}
                                    onClick={() => setActiveModule(module.id)}
                                    style={{
                                        background: 'white',
                                        padding: isMobile ? '12px 8px' : '20px',
                                        borderRadius: '10px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        borderTop: `3px solid ${module.color}`,
                                        transition: 'transform 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: isMobile ? '24px' : '28px', marginBottom: '5px' }}>{module.icon}</div>
                                    <h4 style={{ fontSize: isMobile ? '12px' : '14px', margin: '0 0 3px', color: module.color }}>{module.title}</h4>
                                    <p style={{ fontSize: isMobile ? '9px' : '11px', color: '#666', margin: 0 }}>{module.description}</p>
                                    <div style={{ fontSize: '10px', color: module.color, marginTop: '5px' }}>Click →</div>
                                </div>
                            ))}
                        </div>
                    </>
                );
        }
    };

    return (
        <div style={{ 
            padding: isMobile ? '10px' : '20px', 
            maxWidth: '1200px', 
            margin: '0 auto', 
            minHeight: '100vh',
            background: '#f5f5f5'
        }}>
            {activeModule !== 'overview' && (
                <button 
                    onClick={() => setActiveModule('overview')}
                    style={{
                        width: '100%',
                        padding: isMobile ? '10px' : '12px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: isMobile ? '13px' : '14px',
                        cursor: 'pointer',
                        marginBottom: '15px'
                    }}
                >
                    ← Back to Dashboard
                </button>
            )}

            {renderModule()}
        </div>
    );
};

export default Dashboard;