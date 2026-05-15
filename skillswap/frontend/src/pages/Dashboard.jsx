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
    const [isTablet, setIsTablet] = useState(false);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width <= 480);
            setIsTablet(width > 480 && width <= 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Determine number of columns based on screen size
    const getGridColumns = () => {
        if (isMobile) return 'repeat(2, 1fr)';  // 2 columns on mobile
        if (isTablet) return 'repeat(2, 1fr)'; // 2 columns on tablet
        return 'repeat(3, 1fr)';               // 3 columns on desktop
    };

    const modules = [
        {
            id: 'profile',
            title: 'User Profile',
            description: 'Manage your skills and personal information',
            color: '#007bff',
            icon: '👤'
        },
        {
            id: 'matching',
            title: 'Skill Matching',
            description: 'Find perfect skill swap partners',
            color: '#28a745',
            icon: '🔍'
        },
        {
            id: 'requests',
            title: 'Swap Requests',
            description: 'View and manage your skill swap requests',
            color: '#17a2b8',
            icon: '📩'
        },
        {
            id: 'credits',
            title: 'Credit System',
            description: 'Earn and spend skill credits',
            color: '#ffc107',
            icon: '💰'
        },
        {
            id: 'chat',
            title: 'Chat & Scheduling',
            description: 'Communicate and schedule sessions',
            color: '#dc3545',
            icon: '💬'
        },
        {
            id: 'reviews',
            title: 'Reviews & Ratings',
            description: 'See what the community is saying',
            color: '#6f42c1',
            icon: '🌍'
        }
    ];

    if (isAdmin) {
        modules.push({
            id: 'admin',
            title: 'Admin Dashboard',
            description: 'View all users and system analytics',
            color: '#fd7e14',
            icon: '👑'
        });
    }

    const renderModule = () => {
        switch (activeModule) {
            case 'profile':
                return <Profile user={user} />;
            case 'matching':
                return <SkillMatching user={user} />;
            case 'requests':
                return <SwapRequests user={user} />;
            case 'credits':
                return <CreditSystem user={user} />;
            case 'admin':
                return <UserManagement currentUser={user} />;
            case 'chat':
                return <Messages user={user} onBack={() => setActiveModule('overview')} />;
            case 'reviews':
                return <ReviewList currentUser={user} />;
            default:
                return (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: getGridColumns(),
                        gap: isMobile ? '12px' : '20px',
                        margin: isMobile ? '10px 0' : '30px 0'
                    }}>
                        {modules.map(module => (
                            <div 
                                key={module.id}
                                onClick={() => setActiveModule(module.id)}
                                style={{
                                    background: 'white',
                                    padding: isMobile ? '12px' : '25px',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    borderLeft: `4px solid ${module.color}`,
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{ 
                                    fontSize: isMobile ? '28px' : '2em', 
                                    marginBottom: '8px' 
                                }}>
                                    {module.icon}
                                </div>
                                <h3 style={{ 
                                    color: module.color, 
                                    marginBottom: '5px',
                                    fontSize: isMobile ? '14px' : '20px',
                                    fontWeight: '600'
                                }}>{module.title}</h3>
                                <p style={{ 
                                    color: '#666', 
                                    fontSize: isMobile ? '11px' : '14px',
                                    marginBottom: '10px',
                                    display: isMobile ? 'none' : 'block'
                                }}>{module.description}</p>
                                <div style={{ 
                                    color: module.color,
                                    fontWeight: 'bold',
                                    fontSize: isMobile ? '11px' : '14px'
                                }}>
                                    Click →
                                </div>
                            </div>
                        ))}
                    </div>
                );
        }
    };

    const stats = [
        { label: 'Skill Credits', value: user.skillCredits || 0, icon: '💰', color: '#28a745' },
        { label: 'Reputation Score', value: user.reputationScore || 0, icon: '⭐', color: '#ffc107' },
        { label: 'Skills to Teach', value: user.teachSkills?.length || 0, icon: '🎯', color: '#007bff' },
        { label: 'Skills to Learn', value: user.learnSkills?.length || 0, icon: '📚', color: '#dc3545' }
    ];

    return (
        <div style={{ padding: isMobile ? '8px' : '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: isMobile ? '12px 15px' : '20px 30px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white',
                borderRadius: '12px',
                marginBottom: isMobile ? '12px' : '20px',
                gap: isMobile ? '10px' : '0'
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    flexDirection: isMobile ? 'column' : 'row',
                    textAlign: isMobile ? 'center' : 'left'
                }}>
                    <div style={{
                        width: isMobile ? '45px' : '50px',
                        height: isMobile ? '45px' : '50px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '1.2rem' : '1.2rem',
                        fontWeight: 'bold'
                    }}>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.4rem' }}>
                            Welcome, {user.name || 'User'}
                        </h2>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: isMobile ? '0.7rem' : '0.9rem' }}>
                            {user.email}
                        </p>
                    </div>
                </div>
                
                <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    flexDirection: isMobile ? 'row' : 'row',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    <button 
                        style={{ 
                            background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                            color: 'white',
                            border: 'none',
                            padding: isMobile ? '8px 12px' : '10px 20px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: isMobile ? '0.7rem' : '0.9rem',
                            cursor: 'pointer',
                            flex: isMobile ? 1 : 'none'
                        }}
                        onClick={() => setActiveModule('requests')}
                    >
                        📩 Swap Requests
                    </button>
                    
                    <button 
                        style={{ 
                            background: 'rgba(255,255,255,0.15)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            padding: isMobile ? '8px 12px' : '10px 20px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: isMobile ? '0.7rem' : '0.9rem',
                            cursor: 'pointer',
                            flex: isMobile ? 1 : 'none'
                        }}
                        onClick={onLogout}
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Stats - 2x2 grid on mobile */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: isMobile ? '8px' : '15px',
                margin: isMobile ? '10px 0' : '20px 0'
            }}>
                {stats.map((stat, index) => (
                    <div key={index} style={{
                        background: 'white',
                        padding: isMobile ? '10px' : '20px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: isMobile ? '20px' : '32px' }}>{stat.icon}</div>
                        <div style={{
                            fontSize: isMobile ? '1.3em' : '2em',
                            fontWeight: 'bold',
                            color: stat.color
                        }}>{stat.value}</div>
                        <div style={{ fontSize: isMobile ? '10px' : '14px', color: '#666' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {activeModule !== 'overview' && (
                <button 
                    onClick={() => setActiveModule('overview')}
                    style={{ 
                        marginBottom: '15px', 
                        padding: isMobile ? '8px 16px' : '10px 20px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '12px' : '14px',
                        width: isMobile ? '100%' : 'auto'
                    }}
                >
                    ← Back to Overview
                </button>
            )}

            {renderModule()}
        </div>
    );
};

export default Dashboard;