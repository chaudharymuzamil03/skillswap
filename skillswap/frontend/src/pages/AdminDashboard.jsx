// AdminDashboard.js - Professional Version
import React, { useState, useEffect } from 'react';
import AdminUsersList from '../components/admin/AdminUsersList';
import AdminSkillsManagement from '../components/admin/AdminSkillsManagement';
import AdminTransactions from '../components/admin/AdminTransactions';
import AdminSettings from '../components/admin/AdminSettings';
import AdminReports from '../components/admin/AdminReports';
import ReviewList from '../components/reviews/ReviewList';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  CreditCard, 
  Star, 
  BarChart3, 
  Settings, 
  LogOut,
  Activity,
  Shield,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const AdminDashboard = ({ user, onLogout }) => {
    const [activeModule, setActiveModule] = useState('overview');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        fetchAdminStats();
        
        // Handle responsive
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchAdminStats = async () => {
        try {
            const response = await fetch('http://32.198.132.159:5000/api/admin/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const adminModules = [
        { id: 'overview', title: 'Overview', icon: LayoutDashboard },
        { id: 'users', title: 'Users', icon: Users },
        { id: 'skills', title: 'Skills', icon: Target },
        { id: 'transactions', title: 'Transactions', icon: CreditCard },
        { id: 'reviews', title: 'Reviews', icon: Star },
        { id: 'reports', title: 'Reports', icon: BarChart3 },
        { id: 'settings', title: 'Settings', icon: Settings }
    ];

    // StatCard without percentage change
    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef',
            transition: 'all 0.2s'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ margin: 0, color: '#6c757d', fontSize: '14px', fontWeight: '500' }}>{title}</p>
                    <h2 style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: '700', color: '#212529' }}>
                        {value || 0}
                    </h2>
                    {subtitle && (
                        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6c757d' }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Icon size={24} color="white" />
                </div>
            </div>
        </div>
    );

    const QuickLink = ({ icon: Icon, title, onClick }) => (
        <div onClick={onClick} style={{
            background: 'white',
            borderRadius: '10px',
            padding: '16px',
            border: '1px solid #e9ecef',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0d6efd';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e9ecef';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={20} color="#0d6efd" />
            </div>
            <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#212529' }}>{title}</h4>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6c757d' }}>Click to manage</p>
            </div>
            <ChevronRight size={16} color="#adb5bd" style={{ marginLeft: 'auto' }} />
        </div>
    );

    const renderModule = () => {
        if (activeModule === 'overview') {
            return (
                <div>
                    {/* Stats Grid - No percentages */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <StatCard 
                            title="Total Users" 
                            value={stats?.totalUsers} 
                            icon={Users} 
                            color="#0d6efd"
                            subtitle={`${stats?.adminUsers || 0} Admins • ${stats?.regularUsers || 0} Members`}
                        />
                        <StatCard 
                            title="Total Swaps" 
                            value={stats?.totalSwapRequests || 0} 
                            icon={Activity} 
                            color="#28a745"
                            subtitle={`${stats?.pendingRequests || 0} Pending • ${stats?.acceptedRequests || 0} Completed`}
                        />
                        <StatCard 
                            title="Total Credits" 
                            value={stats?.totalCredits || 0} 
                            icon={CreditCard} 
                            color="#ffc107"
                            subtitle="Total credits in system"
                        />
                        <StatCard 
                            title="Total Reviews" 
                            value={stats?.totalReviews || 0} 
                            icon={Star} 
                            color="#dc3545"
                            subtitle={`${stats?.totalSkillProgress || 0} Skill Verifications`}
                        />
                    </div>

                    {/* Quick Actions */}
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: '#212529' }}>
                            Quick Actions
                        </h3>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                            gap: '15px' 
                        }}>
                            <QuickLink icon={Users} title="Manage Users" onClick={() => setActiveModule('users')} />
                            <QuickLink icon={Target} title="Manage Skills" onClick={() => setActiveModule('skills')} />
                            <QuickLink icon={CreditCard} title="View Transactions" onClick={() => setActiveModule('transactions')} />
                            <QuickLink icon={BarChart3} title="View Reports" onClick={() => setActiveModule('reports')} />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: '#212529' }}>
                            Recent Activity
                        </h3>
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            border: '1px solid #e9ecef',
                            overflow: 'hidden'
                        }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e7f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={16} color="#0d6efd" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>System ready</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6c757d' }}>Admin panel operational</p>
                                </div>
                            </div>
                            <div style={{ padding: '16px', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#d4edda', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={16} color="#28a745" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Platform active</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6c757d' }}>All systems running</p>
                                </div>
                            </div>
                            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff3cd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Star size={16} color="#ffc107" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Ready for action</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6c757d' }}>Manage users and skills</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        const moduleComponents = {
            users: <AdminUsersList currentUser={user} />,
            skills: <AdminSkillsManagement />,
            transactions: <AdminTransactions />,
            reviews: <ReviewList currentUser={user} />,
            reports: <AdminReports />,
            settings: <AdminSettings />
        };

        return moduleComponents[activeModule];
    };

    const currentModule = adminModules.find(m => m.id === activeModule);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                Loading dashboard...
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                    position: 'fixed',
                    top: '15px',
                    left: '15px',
                    zIndex: 1001,
                    background: '#0d6efd',
                    border: 'none',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    display: window.innerWidth < 768 ? 'flex' : 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
            >
                {mobileMenuOpen ? <X size={20} color="white" /> : <Menu size={20} color="white" />}
            </button>

            {/* Sidebar */}
            <div style={{
                width: sidebarOpen ? '260px' : '0',
                background: 'white',
                borderRight: '1px solid #e9ecef',
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                overflow: 'hidden',
                transition: 'width 0.3s ease',
                zIndex: 1000,
                boxShadow: sidebarOpen ? '2px 0 8px rgba(0,0,0,0.05)' : 'none'
            }}>
                <div style={{ padding: '24px 20px', borderBottom: '1px solid #e9ecef' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0d6efd' }}>
                        SkillSwap Admin
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6c757d' }}>Dashboard</p>
                </div>

                <nav style={{ padding: '20px' }}>
                    {adminModules.map((module) => {
                        const Icon = module.icon;
                        const isActive = activeModule === module.id;
                        return (
                            <div
                                key={module.id}
                                onClick={() => {
                                    setActiveModule(module.id);
                                    setMobileMenuOpen(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    marginBottom: '8px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    background: isActive ? '#0d6efd' : 'transparent',
                                    color: isActive ? 'white' : '#6c757d',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = '#f8f9fa';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <Icon size={20} />
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>{module.title}</span>
                            </div>
                        );
                    })}

                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
                        <div
                            onClick={onLogout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                color: '#dc3545',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <LogOut size={20} />
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>Sign Out</span>
                        </div>
                    </div>
                </nav>
            </div>

            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 999,
                        display: window.innerWidth < 768 ? 'block' : 'none'
                    }}
                />
            )}

            {/* Main Content */}
            <div style={{
                marginLeft: sidebarOpen ? (window.innerWidth < 768 ? '0' : '260px') : '0',
                padding: window.innerWidth < 768 ? '70px 15px 20px' : '30px',
                transition: 'margin-left 0.3s ease'
            }}>
                {/* Header */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    marginBottom: '24px',
                    border: '1px solid #e9ecef',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '15px'
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#212529' }}>
                            {currentModule?.title}
                        </h1>
                        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6c757d' }}>
                            Welcome back, {user.name}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            padding: '8px 16px',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Shield size={16} color="#28a745" />
                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#212529' }}>Admin Access</span>
                        </div>
                    </div>
                </div>

                {/* Module Content */}
                {renderModule()}
            </div>

            <style>{`
                @media (max-width: 768px) {
                    body {
                        overflow-x: hidden;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
