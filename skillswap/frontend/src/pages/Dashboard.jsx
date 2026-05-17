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
            setIsMobile(width <= 768);  // Mobile only
            setIsTablet(width > 768 && width <= 1024);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Determine number of columns based on screen size
    const getGridColumns = () => {
        if (isMobile) return 'repeat(2, 1fr)';  // 2 columns on mobile
        if (isTablet) return 'repeat(3, 1fr)';  // 3 columns on tablet
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
                    <div className="modules-scroll-container" style={{
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
        <div style={{ 
            padding: isMobile ? '0' : '20px', 
            maxWidth: '1200px', 
            margin: '0 auto',
            minHeight: '100vh',
            background: '#f0f2f5'
        }}>
            {/* Mobile: Sticky Header - Fixed on scroll */}
            {isMobile ? (
                // MOBILE VERSION - Sticky Header
                <>
                    {/* Fixed Header (Sticky on scroll) */}
                    <div style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        background: '#f0f2f5',
                        padding: '12px 12px 0 12px'
                    }}>
                        {/* Header Banner */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '12px 15px',
                            borderRadius: '12px',
                            marginBottom: '12px'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px'
                            }}>
                                <div style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    color: 'white'
                                }}>
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '14px', color: 'white' }}>
                                        Welcome, {user.name || 'User'}
                                    </h2>
                                    <p style={{ margin: 0, opacity: 0.8, fontSize: '11px', color: 'white' }}>
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '8px',
                            marginBottom: '12px'
                        }}>
                            {stats.map((stat, index) => (
                                <div key={index} style={{
                                    background: 'white',
                                    padding: '8px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ fontSize: '16px' }}>{stat.icon}</div>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: stat.color
                                    }}>{stat.value}</div>
                                    <div style={{ fontSize: '9px', color: '#666' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ 
                            display: 'flex', 
                            gap: '8px',
                            marginBottom: '12px'
                        }}>
                            <button 
                                style={{ 
                                    flex: 1,
                                    background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setActiveModule('requests')}
                            >
                                📩 Swap Requests
                            </button>
                            <button 
                                style={{ 
                                    flex: 1,
                                    background: 'rgba(0,0,0,0.6)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                                onClick={onLogout}
                            >
                                🚪 Logout
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Modules Section */}
                    <div style={{
                        padding: '0 12px 12px 12px',
                        maxHeight: 'calc(100vh - 280px)',
                        overflowY: 'auto'
                    }}>
                        {activeModule !== 'overview' ? (
                            <>
                                <button 
                                    onClick={() => setActiveModule('overview')}
                                    style={{ 
                                        width: '100%',
                                        padding: '10px',
                                        background: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        marginBottom: '12px'
                                    }}
                                >
                                    ← Back to Overview
                                </button>
                                {renderModule()}
                            </>
                        ) : (
                            <div className="modules-scroll-container" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '12px'
                            }}>
                                {modules.map(module => (
                                    <div 
                                        key={module.id}
                                        onClick={() => setActiveModule(module.id)}
                                        style={{
                                            background: 'white',
                                            padding: '14px',
                                            borderRadius: '12px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            borderLeft: `3px solid ${module.color}`
                                        }}
                                    >
                                        <div style={{ fontSize: '24px', marginBottom: '5px' }}>{module.icon}</div>
                                        <h3 style={{ fontSize: '12px', margin: '0', color: module.color, fontWeight: '600' }}>{module.title}</h3>
                                        <div style={{ fontSize: '10px', color: module.color, marginTop: '5px' }}>Click →</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                // DESKTOP VERSION - NO CHANGES (Original)
                <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '20px 30px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'white',
                        borderRadius: '12px',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                            }}>
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Welcome, {user.name || 'User'}</h2>
                                <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>{user.email}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                style={{ 
                                    background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
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
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                                onClick={onLogout}
                            >
                                🚪 Logout
                            </button>
                        </div>
                    </div>

                    {/* Stats - 4 in one row */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '15px',
                        marginBottom: '25px'
                    }}>
                        {stats.map((stat, index) => (
                            <div key={index} style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ fontSize: '32px' }}>{stat.icon}</div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                                <div style={{ fontSize: '14px', color: '#666' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {activeModule !== 'overview' && (
                        <button 
                            onClick={() => setActiveModule('overview')}
                            style={{ 
                                marginBottom: '20px', 
                                padding: '10px 20px',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            ← Back to Overview
                        </button>
                    )}

                    {renderModule()}
                </div>
            )}
        </div>
    );
};

export default Dashboard;