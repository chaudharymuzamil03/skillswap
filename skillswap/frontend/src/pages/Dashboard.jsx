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
        { id: 'profile', title: 'User Profile', description: 'Manage your skills and personal information', color: '#007bff', icon: '👤' },
        { id: 'matching', title: 'Skill Matching', description: 'Find perfect skill swap partners', color: '#28a745', icon: '🔍' },
        { id: 'requests', title: 'Swap Requests', description: 'View and manage your skill swap requests', color: '#17a2b8', icon: '📩' },
        { id: 'credits', title: 'Credit System', description: 'Earn and spend skill credits', color: '#ffc107', icon: '💰' },
        { id: 'chat', title: 'Chat & Scheduling', description: 'Communicate and schedule sessions', color: '#dc3545', icon: '💬' },
        { id: 'reviews', title: 'Reviews & Ratings', description: 'See what the community is saying', color: '#6f42c1', icon: '⭐' }
    ];

    if (isAdmin) {
        modules.push({ id: 'admin', title: 'Admin Dashboard', description: 'View all users and system analytics', color: '#fd7e14', icon: '👑' });
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
                        {/* Header - Laptop aur mobile dono ke liye same */}
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: isMobile ? '12px 15px' : '20px 25px',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: 'white',
                            gap: isMobile ? '12px' : '0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    width: isMobile ? '45px' : '55px',
                                    height: isMobile ? '45px' : '55px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: isMobile ? '20px' : '24px',
                                    fontWeight: 'bold'
                                }}>
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px' }}>Welcome, {user.name || 'User'}!</h2>
                                    <p style={{ margin: '4px 0 0', fontSize: isMobile ? '11px' : '14px', opacity: 0.9 }}>{user.email}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
                                <button 
                                    onClick={() => setActiveModule('requests')}
                                    style={{
                                        flex: isMobile ? 1 : 'none',
                                        background: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        padding: isMobile ? '8px 12px' : '10px 20px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: isMobile ? '12px' : '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    📩 Swap Requests
                                </button>
                                <button 
                                    onClick={onLogout}
                                    style={{
                                        flex: isMobile ? 1 : 'none',
                                        background: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        padding: isMobile ? '8px 12px' : '10px 20px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: isMobile ? '12px' : '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    🚪 Logout
                                </button>
                            </div>
                        </div>

                        {/* Stats - 4 cards in one row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: isMobile ? '10px' : '15px',
                            marginBottom: '25px'
                        }}>
                            <div style={{ background: 'white', padding: isMobile ? '12px' : '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                <div style={{ fontSize: isMobile ? '24px' : '28px' }}>💰</div>
                                <div style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 'bold', color: '#28a745' }}>{user.skillCredits || 0}</div>
                                <div style={{ fontSize: isMobile ? '11px' : '14px', color: '#666' }}>Skill Credits</div>
                            </div>
                            <div style={{ background: 'white', padding: isMobile ? '12px' : '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                <div style={{ fontSize: isMobile ? '24px' : '28px' }}>⭐</div>
                                <div style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 'bold', color: '#ffc107' }}>{user.reputationScore || 0}</div>
                                <div style={{ fontSize: isMobile ? '11px' : '14px', color: '#666' }}>Reputation Score</div>
                            </div>
                            <div style={{ background: 'white', padding: isMobile ? '12px' : '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                <div style={{ fontSize: isMobile ? '24px' : '28px' }}>🎯</div>
                                <div style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 'bold', color: '#007bff' }}>{user.teachSkills?.length || 0}</div>
                                <div style={{ fontSize: isMobile ? '11px' : '14px', color: '#666' }}>Skills to Teach</div>
                            </div>
                            <div style={{ background: 'white', padding: isMobile ? '12px' : '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                <div style={{ fontSize: isMobile ? '24px' : '28px' }}>📚</div>
                                <div style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 'bold', color: '#dc3545' }}>{user.learnSkills?.length || 0}</div>
                                <div style={{ fontSize: isMobile ? '11px' : '14px', color: '#666' }}>Skills to Learn</div>
                            </div>
                        </div>

                        {/* Modules - Laptop: 3 per row, Mobile: 2 per row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                            gap: '20px'
                        }}>
                            {modules.map(module => (
                                <div 
                                    key={module.id}
                                    className="module-card"
                                    onClick={() => setActiveModule(module.id)}
                                    style={{
                                        background: 'white',
                                        padding: isMobile ? '18px' : '25px',
                                        borderRadius: '15px',
                                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        borderLeft: `5px solid ${module.color}`,
                                        textAlign: isMobile ? 'center' : 'left'
                                    }}
                                >
                                    <div style={{ fontSize: isMobile ? '2.2em' : '2em', marginBottom: '10px' }}>{module.icon}</div>
                                    <h3 style={{ color: module.color, marginBottom: '8px', fontSize: isMobile ? '16px' : '18px' }}>{module.title}</h3>
                                    <p style={{ color: '#666', fontSize: isMobile ? '12px' : '14px' }}>{module.description}</p>
                                    <div style={{ color: module.color, fontWeight: 'bold', marginTop: '10px', fontSize: isMobile ? '12px' : '14px' }}>Click to open →</div>
                                </div>
                            ))}
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="dashboard" style={{ padding: isMobile ? '12px' : '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {activeModule !== 'overview' && (
                <button 
                    className="btn btn-secondary" 
                    onClick={() => setActiveModule('overview')}
                    style={{ marginBottom: '20px', width: isMobile ? '100%' : 'auto', padding: isMobile ? '10px' : '8px 20px' }}
                >
                    ← Back to Overview
                </button>
            )}

            {renderModule()}
        </div>
    );
};

export default Dashboard;