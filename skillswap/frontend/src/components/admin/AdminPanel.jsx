import React, { useState, useEffect } from 'react';

const AdminPanel = ({ currentUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    // Check if current user is admin
    const isAdmin = currentUser.role === 'admin';

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://35.172.194.189:5000/api/admin/users');
            const data = await response.json();
            
            if (data.success) {
                setUsers(data.users);
            } else {
                setError('Failed to fetch users');
            }
        } catch (error) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Handle change password click
    const handleChangePasswordClick = (user) => {
        setSelectedUser(user);
        setPasswordForm({
            newPassword: '',
            confirmPassword: ''
        });
        setShowPasswordModal(true);
    };

    // Handle change password
    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            alert('Password must be at least 8 characters!');
            return;
        }

        try {
            const response = await fetch(`http://35.172.194.189:5000/api/admin/users/${selectedUser._id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    newPassword: passwordForm.newPassword,
                    currentUserId: currentUser.id
                })
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Password changed successfully!');
                setShowPasswordModal(false);
                setSelectedUser(null);
                setPasswordForm({
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Error changing password');
        }
    };

    // If user is not admin, show access denied
    if (!isAdmin) {
        return (
            <div style={{ 
                padding: '40px',
                textAlign: 'center',
                background: 'white',
                borderRadius: '15px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                margin: '20px'
            }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚫</div>
                <h2 style={{ color: '#dc3545', marginBottom: '15px' }}>Access Denied</h2>
                <p style={{ color: '#666', fontSize: '16px', marginBottom: '20px' }}>
                    You don't have permission to access the admin panel.
                </p>
                <p style={{ color: '#999', fontSize: '14px' }}>
                    Only administrators can view this page.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '200px',
                flexDirection: 'column',
                gap: '15px'
            }}>
                <div style={{ fontSize: '32px' }}>⏳</div>
                <div>Loading admin data...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            {/* Admin Header */}
            <div style={{ 
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                padding: '30px',
                borderRadius: '15px',
                marginBottom: '30px',
                position: 'relative'
            }}>
                <h1 style={{ margin: 0, fontSize: '28px' }}>👑 Admin Dashboard</h1>
                <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
                    Manage users and view system analytics
                </p>
                
                <div style={{ 
                    display: 'flex',
                    gap: '15px',
                    marginTop: '20px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ 
                        background: 'rgba(255,255,255,0.2)',
                        padding: '10px 20px',
                        borderRadius: '20px',
                        fontWeight: '600'
                    }}>
                        👥 Total Users: {users.length}
                    </div>
                    
                    <div style={{ 
                        background: 'rgba(255,255,255,0.2)',
                        padding: '10px 20px',
                        borderRadius: '20px',
                        fontWeight: '600'
                    }}>
                        👑 Admins: {users.filter(u => u.role === 'admin').length}
                    </div>
                    
                    <div style={{ 
                        background: 'rgba(255,255,255,0.2)',
                        padding: '10px 20px',
                        borderRadius: '20px',
                        fontWeight: '600'
                    }}>
                        💰 Avg Credits: {Math.round(users.reduce((sum, user) => sum + user.skillCredits, 0) / users.length)}
                    </div>
                </div>
                
                <button 
                    onClick={() => handleChangePasswordClick(currentUser)}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        padding: '8px 15px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    🔐 Change My Password
                </button>
            </div>

            {error && (
                <div style={{
                    background: '#f8d7da',
                    color: '#721c24',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    {error}
                </div>
            )}

            {/* Users Table */}
            <div style={{
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa' }}>
                            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>User</th>
                            <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Role</th>
                            <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Credits</th>
                            <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Reputation</th>
                            <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Skills</th>
                            <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Registered</th>
                            <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={user._id} style={{ 
                                borderBottom: '1px solid #dee2e6',
                                background: index % 2 === 0 ? '#fafafa' : 'white'
                            }}>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ fontWeight: '600' }}>{user.name}</div>
                                    <div style={{ color: '#666', fontSize: '14px' }}>{user.email}</div>
                                    {user._id === currentUser.id && (
                                        <div style={{
                                            display: 'inline-block',
                                            background: '#667eea',
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            marginTop: '5px'
                                        }}>
                                            You
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <span style={{
                                        background: user.role === 'admin' ? '#dc3545' : '#28a745',
                                        color: 'white',
                                        padding: '5px 10px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>
                                    <span style={{ 
                                        color: user.skillCredits > 50 ? '#28a745' : user.skillCredits > 0 ? '#ffc107' : '#dc3545'
                                    }}>
                                        {user.skillCredits} 💰
                                    </span>
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <span style={{ 
                                        color: user.reputationScore > 50 ? '#28a745' : user.reputationScore > 0 ? '#ffc107' : '#666'
                                    }}>
                                        {user.reputationScore} ⭐
                                    </span>
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <span style={{ color: '#666' }}>
                                        🎯{user.teachSkills.length} | 📚{user.learnSkills.length}
                                    </span>
                                </td>
                                <td style={{ padding: '15px', color: '#666' }}>
                                    {formatDate(user.createdAt)}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <button 
                                        onClick={() => handleChangePasswordClick(user)}
                                        style={{
                                            background: '#6f42c1',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            marginBottom: '5px',
                                            width: '100%',
                                            maxWidth: '150px'
                                        }}
                                    >
                                        🔑 Change Password
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button 
                    onClick={fetchUsers}
                    style={{
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        margin: '0 auto'
                    }}
                >
                    🔄 Refresh Data
                </button>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && selectedUser && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        width: '400px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ marginBottom: '20px' }}>
                            🔑 Change Password for {selectedUser.name}
                        </h3>
                        
                        {selectedUser._id === currentUser.id && (
                            <div style={{
                                background: '#fff3cd',
                                color: '#856404',
                                padding: '10px',
                                borderRadius: '6px',
                                marginBottom: '20px',
                                fontSize: '14px',
                                border: '1px solid #ffeaa7'
                            }}>
                                ⚠️ You are changing your own password. You will need to login again with the new password.
                            </div>
                        )}
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                New Password
                            </label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                placeholder="Enter new password"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px'
                                }}
                            />
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                Must be at least 8 characters
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                placeholder="Confirm new password"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setSelectedUser(null);
                                }}
                                style={{
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleChangePassword}
                                style={{
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Info Box */}
            <div style={{
                marginTop: '30px',
                padding: '20px',
                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderRadius: '10px',
                border: '1px solid #dee2e6'
            }}>
                <h4 style={{ marginTop: 0, marginBottom: '10px' }}>💡 Admin Features:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
                    <li>View all users in the system</li>
                    <li>See user roles, credits, and reputation</li>
                    <li>Change any user's password (including your own)</li>
                    <li>Go to User Management for more advanced controls</li>
                </ul>
            </div>
        </div>
    );
};

export default AdminPanel;
