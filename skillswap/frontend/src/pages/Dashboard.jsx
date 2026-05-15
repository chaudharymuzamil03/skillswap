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

    // Check if user is admin
    const isAdmin = user?.role === 'admin';

    // Detect mobile screen
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    // Add admin module only if user is admin
    if (isAdmin) {
        modules.push({
            id: 'admin',
            title: 'Admin Dashboard',
            description: 'View all users and system analytics (Admin Only)',
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
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: isMobile ? '15px' : '20px',
                        margin: isMobile ? '15px 0' : '30px 0'
                    }}>
                        {modules.map(module => (
                            <div 
                                key={module.id}
                                onClick={() => setActiveModule(module.id)}
                                style={{
                                    background: 'white',
                                    padding: isMobile ? '20px' : '25px',
                                    borderRadius: '15px',
                                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    borderLeft: `5px solid ${module.color}`,
                                    textAlign: isMobile ? 'center' : 'left'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                                }}
                            >
                                <div style={{ 
                                    fontSize: isMobile ? '2.5em' : '2em', 
                                    marginBottom: '10px' 
                                }}>
                                    {module.icon}
                                </div>
                                <h3 style={{ 
                                    color: module.color, 
                                    marginBottom: '10px',
                                    fontSize: isMobile ? '18px' : '20px'
                                }}>{module.title}</h3>
                                <p style={{ 
                                    color: '#666', 
                                    fontSize: isMobile ? '13px' : '14px',
                                    marginBottom: '15px'
                                }}>{module.description}</p>
                                <div style={{ 
                                    color: module.color,
                                    fontWeight: 'bold',
                                    fontSize: isMobile ? '13px' : '14px'
                                }}>
                                    Click to open →
                                </div>
                            </div>
                        ))}
                    </div>
                );
        }
    };

    // Stats data
    const stats = [
        { label: 'Skill Credits', value: user.skillCredits || 0, icon: '💰', color: '#28a745' },
        { label: 'Reputation Score', value: user.reputationScore || 0, icon: '⭐', color: '#ffc107' },
        { label: 'Skills to Teach', value: user.teachSkills?.length || 0, icon: '🎯', color: '#007bff' },
        { label: 'Skills to Learn', value: user.learnSkills?.length || 0, icon: '📚', color: '#dc3545' }
    ];

    return (
        <div className="dashboard" style={{ padding: isMobile ? '10px' : '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: isMobile ? '15px' : '1.5rem 2rem',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white',
                borderRadius: '12px',
                marginBottom: isMobile ? '15px' : '2rem',
                gap: isMobile ? '15px' : '0'
            }}>
                <div className="user-info" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '15px',
                    flexDirection: isMobile ? 'column' : 'row',
                    textAlign: isMobile ? 'center' : 'left',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    <div className="avatar" style={{
                        width: isMobile ? '60px' : '50px',
                        height: isMobile ? '60px' : '50px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '1.5rem' : '1.2rem',
                        fontWeight: 'bold',
                        backdropFilter: 'blur(10px)'
                    }}>
                        {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.4rem' }}>
                            Welcome, {user.name || 'User'} {isAdmin && '👑'}
                        </h2>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                            {user.email} {isAdmin && '(Admin)'}
                        </p>
                    </div>
                </div>
                
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    flexDirection: isMobile ? 'column' : 'row',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    <button 
                        style={{ 
                            background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                            color: 'white',
                            border: 'none',
                            padding: isMobile ? '10px 16px' : '0.7rem 1.3rem',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            width: isMobile ? '100%' : 'auto'
                        }}
                        onClick={() => setActiveModule('requests')}
                    >
                        📩 Swap Requests
                    </button>
                    
                    <button 
                        style={{ 
                            background: 'rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            padding: isMobile ? '10px 16px' : '0.7rem 1.3rem',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            width: isMobile ? '100%' : 'auto'
                        }}
                        onClick={onLogout}
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: isMobile ? '10px' : '15px',
                margin: '20px 0'
            }}>
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card" style={{
                        background: 'white',
                        padding: isMobile ? '15px' : '20px',
                        borderRadius: '10px',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: isMobile ? '28px' : '32px' }}>{stat.icon}</div>
                        <div className="stat-number" style={{
                            fontSize: isMobile ? '1.5em' : '2em',
                            fontWeight: 'bold',
                            color: stat.color
                        }}>{stat.value}</div>
                        <div style={{ fontSize: isMobile ? '11px' : '14px', color: '#666' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Show admin badge if user is admin */}
            {isAdmin && (
                <div style={{
                    background: 'linear-gradient(45deg, #fd7e14, #ff922b)',
                    color: 'white',
                    padding: isMobile ? '8px 15px' : '10px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontWeight: '600',
                    fontSize: isMobile ? '13px' : '14px',
                    textAlign: 'center'
                }}>
                    <span>👑</span>
                    <span>You have Administrator privileges</span>
                </div>
            )}

            {activeModule !== 'overview' && (
                <button 
                    className="btn btn-secondary" 
                    onClick={() => setActiveModule('overview')}
                    style={{ 
                        marginBottom: '20px', 
                        width: isMobile ? '100%' : 'auto',
                        padding: isMobile ? '10px 20px' : '8px 20px'
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