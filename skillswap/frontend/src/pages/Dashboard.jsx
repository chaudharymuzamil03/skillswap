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
            default: return (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    gap: '20px'
                }}>
                    {modules.map(module => (
                        <div key={module.id} className="module-card" onClick={() => setActiveModule(module.id)} style={{
                            background: 'white',
                            padding: '25px',
                            borderRadius: '15px',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            borderLeft: `5px solid ${module.color}`,
                            textAlign: 'left'
                        }}>
                            <div style={{ fontSize: '2em', marginBottom: '10px' }}>{module.icon}</div>
                            <h3 style={{ color: module.color, marginBottom: '10px' }}>{module.title}</h3>
                            <p style={{ color: '#666', fontSize: '14px' }}>{module.description}</p>
                            <div style={{ color: module.color, fontWeight: 'bold', marginTop: '10px' }}>Click to open →</div>
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

    // ============================================
    // PC VERSION (ORIGINAL - NO CHANGES)
    // ============================================
    if (!isMobile) {
        return (
            <div className="dashboard" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '20px 25px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: '55px', height: '55px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '24px', fontWeight: 'bold'
                        }}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>Welcome, {user.name || 'User'}!</h2>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>{user.email}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setActiveModule('requests')} style={{
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                            padding: '10px 20px', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                        }}>📩 Swap Requests</button>
                        <button onClick={onLogout} style={{
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                            padding: '10px 20px', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                        }}>🚪 Logout</button>
                    </div>
                </div>

                {/* Stats */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '15px', marginBottom: '25px'
                }}>
                    {stats.map((stat, i) => (
                        <div key={i} style={{
                            background: 'white', padding: '20px', borderRadius: '10px',
                            textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '28px' }}>{stat.icon}</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: '14px', color: '#666' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {activeModule !== 'overview' && (
                    <button onClick={() => setActiveModule('overview')} style={{
                        marginBottom: '20px', padding: '8px 20px',
                        background: '#6c757d', color: 'white', border: 'none',
                        borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
                    }}>← Back to Overview</button>
                )}

                {renderModule()}
            </div>
        );
    }

    // ============================================
    // MOBILE VERSION (NEW STICKY HEADER)
    // ============================================
    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
            {/* Sticky Header */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: '#f0f2f5', padding: '12px 12px 0 12px'
            }}>
                {/* Welcome Banner */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    padding: '12px 15px', borderRadius: '12px', marginBottom: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '45px', height: '45px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px', fontWeight: 'bold', color: 'white'
                        }}>
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '14px', color: 'white' }}>Welcome, {user.name || 'User'}!</h2>
                            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {stats.map((stat, i) => (
                        <div key={i} style={{
                            flex: 1, background: 'white', padding: '8px',
                            borderRadius: '10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '18px' }}>{stat.icon}</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: '9px', color: '#666' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button onClick={() => setActiveModule('requests')} style={{
                        flex: 1, background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                        color: 'white', border: 'none', padding: '10px',
                        borderRadius: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer'
                    }}>📩 Swap Requests</button>
                    <button onClick={onLogout} style={{
                        flex: 1, background: '#6c757d', color: 'white',
                        border: 'none', padding: '10px', borderRadius: '8px',
                        fontWeight: '600', fontSize: '12px', cursor: 'pointer'
                    }}>🚪 Logout</button>
                </div>
            </div>

            {/* Scrollable Modules Area */}
            <div style={{ padding: '12px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
                {activeModule !== 'overview' ? (
                    <>
                        <button onClick={() => setActiveModule('overview')} style={{
                            width: '100%', padding: '10px', background: '#6c757d',
                            color: 'white', border: 'none', borderRadius: '8px',
                            fontSize: '13px', cursor: 'pointer', marginBottom: '12px'
                        }}>← Back to Overview</button>
                        {renderModule()}
                    </>
                ) : (
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px'
                    }}>
                        {modules.map(module => (
                            <div key={module.id} onClick={() => setActiveModule(module.id)} style={{
                                background: 'white', padding: '14px', borderRadius: '12px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer',
                                textAlign: 'center', borderLeft: `3px solid ${module.color}`
                            }}>
                                <div style={{ fontSize: '28px', marginBottom: '5px' }}>{module.icon}</div>
                                <h3 style={{ fontSize: '13px', margin: '0', color: module.color, fontWeight: '600' }}>{module.title}</h3>
                                <div style={{ fontSize: '11px', color: module.color, marginTop: '5px' }}>Click →</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;