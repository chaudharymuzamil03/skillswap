import React, { useState } from 'react';
import Profile from '../components/profile/Profile';
import SkillMatching from '../components/matching/SkillMatching';
import CreditSystem from '../components/credits/CreditSystem';
import UserManagement from '../components/admin/UserManagement';
import SwapRequests from '../components/Requests/SwapRequests';
import Messages from '../pages/Messages';
import ReviewList from '../components/reviews/ReviewList';

const Dashboard = ({ user, onLogout }) => {
    const [activeModule, setActiveModule] = useState('overview');

    // Check if user is admin
    const isAdmin = user?.role === 'admin';

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
                // Global reviews feed - shows ALL reviews from ALL users
                return <ReviewList currentUser={user} />;
            default:
                return (
                    <div className="modules">
                        {modules.map(module => (
                            <div 
                                key={module.id}
                                className="module-card"
                                onClick={() => setActiveModule(module.id)}
                                style={{ borderLeftColor: module.color }}
                            >
                                <div style={{ 
                                    fontSize: '2em', 
                                    marginBottom: '10px' 
                                }}>
                                    {module.icon}
                                </div>
                                <h3 style={{ color: module.color }}>{module.title}</h3>
                                <p>{module.description}</p>
                                <div style={{ 
                                    marginTop: '15px', 
                                    color: module.color,
                                    fontWeight: 'bold'
                                }}>
                                    Click to open →
                                </div>
                            </div>
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="header" style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '1.5rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white',
                borderRadius: '12px',
                marginBottom: '2rem'
            }}>
                <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="avatar" style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        backdropFilter: 'blur(10px)'
                    }}>
                        {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>
                            Welcome, {user.name} {isAdmin && '👑'}
                        </h2>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
                            {user.email} {isAdmin && '(Admin)'}
                        </p>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Swap Requests Button */}
                    <button 
                        style={{ 
                            background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                            color: 'white',
                            border: 'none',
                            padding: '0.7rem 1.3rem',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        onClick={() => setActiveModule('requests')}
                    >
                        📩 Swap Requests
                    </button>
                    
                    {/* Logout Button */}
                    <button 
                        style={{ 
                            background: 'rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            padding: '0.7rem 1.3rem',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={onLogout}
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats">
                <div className="stat-card">
                    <div className="stat-number">{user.skillCredits}</div>
                    <div>Skill Credits</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{user.reputationScore}</div>
                    <div>Reputation Score</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{user.teachSkills?.length || 0}</div>
                    <div>Skills to Teach</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{user.learnSkills?.length || 0}</div>
                    <div>Skills to Learn</div>
                </div>
            </div>

            {/* Show admin badge if user is admin */}
            {isAdmin && (
                <div style={{
                    background: 'linear-gradient(45deg, #fd7e14, #ff922b)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontWeight: '600'
                }}>
                    <span>👑</span>
                    <span>You have Administrator privileges</span>
                </div>
            )}

            {activeModule !== 'overview' && (
                <button 
                    className="btn btn-secondary" 
                    onClick={() => setActiveModule('overview')}
                    style={{ marginBottom: '20px', width: 'auto' }}
                >
                    ← Back to Overview
                </button>
            )}

            {renderModule()}
        </div>
    );
};

export default Dashboard;
