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
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                        gap: isMobile ? '12px' : '20px',
                        marginTop: '15px'
                    }}>
                        {modules.map(module => (
                            <div 
                                key={module.id}
                                onClick={() => setActiveModule(module.id)}
                                style={{
                                    background: 'white',
                                    padding: isMobile ? '15px 10px' : '20px',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    borderTop: `3px solid ${module.color}`,
                                    transition: 'transform 0.2s'
                                }}
                            >
                                <div style={{ fontSize: isMobile ? '28px' : '32px', marginBottom: '8px' }}>{module.icon}</div>
                                <h3 style={{ fontSize: isMobile ? '13px' : '16px', margin: '0 0 4px', color: module.color }}>{module.title}</h3>
                                <p style={{ fontSize: isMobile ? '10px' : '12px', color: '#666', margin: 0 }}>{module.description}</p>
                                <div style={{ fontSize: '11px', color: module.color, marginTop: '8px' }}>Click →</div>
                            </div>
                        ))}
                    </div>
                );
        }
    };

    const stats = [
        { label: 'Credits', value: user.skillCredits || 0, icon: '💰', color: '#28a745' },
        { label: 'Reputation', value: user.reputationScore || 0, icon: '⭐', color: '#ffc107' },
        { label: 'Teach', value: user.teachSkills?.length || 0, icon: '🎯', color: '#007bff' },
        { label: 'Learn', value: user.learnSkills?.length || 0, icon: '📚', color: '#dc3545' }
    ];

    return (
        <div style={{ padding: isMobile ? '10px' : '20px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                padding: isMobile ? '12px 15px' : '20px 25px',
                borderRadius: '12px',
                marginBottom: '15px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: isMobile ? '45px' : '55px',
                            height: isMobile ? '45px' : '55px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isMobile ? '20px' : '24px',
                            fontWeight: 'bold',
                            color: 'white'
                        }}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: isMobile ? '14px' : '18px', color: 'white' }}>Welcome, {user.name || 'User'}</h2>
                            <p style={{ margin: '2px 0 0', fontSize: isMobile ? '10px' : '12px', opacity: 0.8, color: 'white' }}>{user.email}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
                        <button 
                            onClick={() => setActiveModule('requests')}
                            style={{
                                flex: 1,
                                background: '#ff6b6b',
                                color: 'white',
                                border: 'none',
                                padding: isMobile ? '8px' : '10px 15px',
                                borderRadius: '8px',
                                fontSize: isMobile ? '11px' : '13px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            📩 Swap Req
                        </button>
                        <button 
                            onClick={onLogout}
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.3)',
                                padding: isMobile ? '8px' : '10px 15px',
                                borderRadius: '8px',
                                fontSize: isMobile ? '11px' : '13px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            🚪 Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats - 4 boxes in one row on mobile? Actually 2x2 grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: isMobile ? '10px' : '15px',
                marginBottom: '20px'
            }}>
                {stats.map((stat, i) => (
                    <div key={i} style={{
                        background: 'white',
                        padding: isMobile ? '10px' : '15px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: isMobile ? '20px' : '24px' }}>{stat.icon}</div>
                        <div style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#666' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

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