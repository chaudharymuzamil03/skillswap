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
        { id: 'profile', name: 'User Profile', icon: '👤', color: '#1877f2', bg: '#e7f3ff' },
        { id: 'matching', name: 'Skill Matching', icon: '🔍', color: '#1877f2', bg: '#e7f3ff' },
        { id: 'requests', name: 'Swap Requests', icon: '📩', color: '#1877f2', bg: '#e7f3ff' },
        { id: 'credits', name: 'Credit System', icon: '💰', color: '#1877f2', bg: '#e7f3ff' },
        { id: 'chat', name: 'Chat & Schedule', icon: '💬', color: '#1877f2', bg: '#e7f3ff' },
        { id: 'reviews', name: 'Reviews', icon: '⭐', color: '#1877f2', bg: '#e7f3ff' }
    ];

    if (isAdmin) {
        modules.push({ id: 'admin', name: 'Admin Panel', icon: '👑', color: '#1877f2', bg: '#e7f3ff' });
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
                        {/* Facebook Style Profile Card */}
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            marginBottom: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            {/* Cover Photo */}
                            <div style={{
                                height: isMobile ? '80px' : '100px',
                                background: 'linear-gradient(135deg, #667eea, #764ba2)'
                            }}></div>
                            
                            {/* Profile Info */}
                            <div style={{ padding: isMobile ? '0 16px 16px' : '0 20px 20px', position: 'relative' }}>
                                {/* Avatar */}
                                <div style={{
                                    width: isMobile ? '70px' : '90px',
                                    height: isMobile ? '70px' : '90px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    marginTop: isMobile ? '-35px' : '-45px',
                                    marginBottom: '10px',
                                    border: '4px solid white',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: isMobile ? '32px' : '40px',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white'
                                }}>
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                
                                {/* Name and Email */}
                                <h2 style={{ margin: '0', fontSize: isMobile ? '18px' : '22px', fontWeight: '600' }}>
                                    {user.name || 'User'}
                                </h2>
                                <p style={{ margin: '4px 0 12px', fontSize: isMobile ? '12px' : '14px', color: '#65676b' }}>
                                    {user.email}
                                </p>
                                
                                {/* Stats Row - Like Facebook */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-around',
                                    borderTop: '1px solid #e4e6eb',
                                    borderBottom: '1px solid #e4e6eb',
                                    padding: '12px 0',
                                    marginTop: '8px'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: '#1877f2' }}>{user.skillCredits || 0}</div>
                                        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#65676b' }}>Credits</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: '#1877f2' }}>{user.reputationScore || 0}</div>
                                        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#65676b' }}>Reputation</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: '#1877f2' }}>{user.teachSkills?.length || 0}</div>
                                        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#65676b' }}>Can Teach</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: '#1877f2' }}>{user.learnSkills?.length || 0}</div>
                                        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#65676b' }}>Want Learn</div>
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                    <button 
                                        onClick={() => setActiveModule('requests')}
                                        style={{
                                            flex: 1,
                                            background: '#1877f2',
                                            color: 'white',
                                            border: 'none',
                                            padding: isMobile ? '8px' : '10px',
                                            borderRadius: '6px',
                                            fontSize: isMobile ? '12px' : '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📩 Swap Requests
                                    </button>
                                    <button 
                                        onClick={onLogout}
                                        style={{
                                            flex: 1,
                                            background: '#e4e6eb',
                                            color: '#050505',
                                            border: 'none',
                                            padding: isMobile ? '8px' : '10px',
                                            borderRadius: '6px',
                                            fontSize: isMobile ? '12px' : '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🚪 Logout
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modules Section - Facebook Style Menu */}
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: isMobile ? '12px' : '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, fontSize: isMobile ? '15px' : '16px', fontWeight: '600' }}>Your shortcuts</h3>
                            </div>
                            
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                                gap: '8px'
                            }}>
                                {modules.map(module => (
                                    <div 
                                        key={module.id}
                                        onClick={() => setActiveModule(module.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: isMobile ? '10px' : '12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f2f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{
                                            width: isMobile ? '36px' : '40px',
                                            height: isMobile ? '36px' : '40px',
                                            borderRadius: '50%',
                                            background: '#e7f3ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: isMobile ? '18px' : '20px'
                                        }}>
                                            {module.icon}
                                        </div>
                                        <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '500' }}>{module.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div style={{ 
            padding: isMobile ? '10px' : '20px', 
            maxWidth: '800px', 
            margin: '0 auto', 
            minHeight: '100vh',
            background: '#f0f2f5'
        }}>
            {activeModule !== 'overview' && (
                <button 
                    onClick={() => setActiveModule('overview')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'white',
                        color: '#1877f2',
                        border: 'none',
                        padding: isMobile ? '10px' : '12px',
                        borderRadius: '8px',
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginBottom: '15px',
                        width: '100%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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