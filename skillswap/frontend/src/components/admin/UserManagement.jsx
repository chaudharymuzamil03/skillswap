import React, { useState, useEffect } from 'react';

const UserManagement = ({ currentUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showSkillsModal, setShowSkillsModal] = useState(false);
    const [selectedUserSkills, setSelectedUserSkills] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUserPassword, setSelectedUserPassword] = useState(null);
    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    // Edit form state
    const [editForm, setEditForm] = useState({
        role: '',
        skillCredits: 0,
        reputationScore: 0
    });

    // Skills form state
    const [skillsForm, setSkillsForm] = useState({
        teachSkills: [],
        learnSkills: []
    });

    // Check if current user is admin
    const isAdmin = currentUser?.role === 'admin';

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://35.172.194.189:5000/api/admin/users');
            const data = await response.json();
            
            if (data.success) {
                setUsers(data.users);
            } else {
                setError(data.message || 'Failed to fetch users');
            }
        } catch (error) {
            setError('Error connecting to server. Make sure backend is running.');
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle edit user
    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditForm({
            role: user.role,
            skillCredits: user.skillCredits,
            reputationScore: user.reputationScore
        });
        setShowEditModal(true);
    };

    // Handle save edit
    const handleSaveEdit = async () => {
        try {
            const response = await fetch(`http://35.172.194.189:5000/api/admin/users/${editingUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...editForm,
                    currentUserId: currentUser?.id
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                setUsers(users.map(user => 
                    user._id === editingUser._id ? data.user : user
                ));
                setShowEditModal(false);
                setEditingUser(null);
                alert('User updated successfully!');
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error updating user');
        }
    };

    // Handle delete user
    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    // Confirm delete
    const handleConfirmDelete = async () => {
        try {
            const response = await fetch(`http://35.172.194.189:5000/api/admin/users/${userToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentUserId: currentUser?.id }),
            });

            const data = await response.json();
            
            if (data.success) {
                setUsers(users.filter(user => user._id !== userToDelete._id));
                setShowDeleteModal(false);
                setUserToDelete(null);
                alert('User deleted successfully!');
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user');
        }
    };

    // Handle edit skills
    const handleEditSkillsClick = (user) => {
        setSelectedUserSkills(user);
        setSkillsForm({
            teachSkills: user.teachSkills,
            learnSkills: user.learnSkills
        });
        setShowSkillsModal(true);
    };

    // Save skills
    const handleSaveSkills = async () => {
        try {
            const response = await fetch(`http://35.172.194.189:5000/api/admin/users/${selectedUserSkills._id}/skills`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(skillsForm),
            });

            const data = await response.json();
            
            if (data.success) {
                setUsers(users.map(user => 
                    user._id === selectedUserSkills._id ? data.user : user
                ));
                setShowSkillsModal(false);
                setSelectedUserSkills(null);
                alert('Skills updated successfully!');
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error updating skills:', error);
            alert('Error updating skills');
        }
    };

    // Handle change password
    const handleChangePasswordClick = (user) => {
        setSelectedUserPassword(user);
        setPasswordForm({
            newPassword: '',
            confirmPassword: ''
        });
        setShowPasswordModal(true);
    };

    // Change password
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
            const response = await fetch(`http://35.172.194.189:5000/api/admin/users/${selectedUserPassword._id}/password`, {
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
                setSelectedUserPassword(null);
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
                    Only administrators can view this page.
                </p>
                <p style={{ color: '#999', fontSize: '14px' }}>
                    Login with admin account to access admin panel.
                </p>
                <div style={{ 
                    background: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '8px',
                    marginTop: '20px',
                    fontSize: '14px'
                }}>
                    <strong>Admin Login:</strong><br/>
                    Email: admin@skillswap.com<br/>
                    Password: Admin@123
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '400px',
                fontSize: '18px',
                color: '#666'
            }}>
                <div>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>⏳</div>
                    Loading users...
                </div>
            </div>
        );
    }

    return (
        <div style={{ 
            padding: '30px',
            background: '#f8f9fa',
            minHeight: '100vh'
        }}>
            {/* Header Section */}
            <div style={{ 
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                padding: '30px',
                borderRadius: '15px',
                marginBottom: '30px'
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <div>
                        <h1 style={{ 
                            margin: 0,
                            fontSize: '32px',
                            fontWeight: '700'
                        }}>
                            👑 Advanced User Management
                        </h1>
                        <p style={{ 
                            margin: '10px 0 0 0',
                            opacity: 0.9,
                            fontSize: '16px'
                        }}>
                            Welcome, {currentUser?.name}. You have full admin privileges.
                        </p>
                    </div>
                    <div style={{ 
                        background: 'rgba(255,255,255,0.2)',
                        padding: '15px 25px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>👥</span>
                        <span>Total Users: {users.length}</span>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        fontSize: '14px'
                    }}>
                        <strong>👤 Admin:</strong> {currentUser?.name}
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        fontSize: '14px'
                    }}>
                        <strong>📧 Email:</strong> {currentUser?.email}
                    </div>
                    <button 
                        onClick={() => handleChangePasswordClick(currentUser)}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        🔐 Change My Password
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    background: '#f8d7da',
                    color: '#721c24',
                    padding: '20px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    border: '1px solid #f5c6cb',
                    fontSize: '16px',
                    textAlign: 'center'
                }}>
                    ❌ {error}
                </div>
            )}

            {/* Users Table Section */}
            <div style={{
                background: 'white',
                borderRadius: '15px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
            }}>
                {/* Table Header */}
                <div style={{
                    background: '#f8f9fa',
                    color: '#333',
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 2fr',
                    gap: '15px',
                    fontWeight: '600',
                    fontSize: '14px',
                    borderBottom: '2px solid #dee2e6'
                }}>
                    <div>User Info</div>
                    <div style={{ textAlign: 'center' }}>Role</div>
                    <div style={{ textAlign: 'center' }}>Credits</div>
                    <div style={{ textAlign: 'center' }}>Reputation</div>
                    <div style={{ textAlign: 'center' }}>Skills</div>
                    <div style={{ textAlign: 'center' }}>Actions</div>
                </div>

                {/* Table Body */}
                <div>
                    {users.length === 0 ? (
                        <div style={{ 
                            padding: '80px 20px', 
                            textAlign: 'center',
                            color: '#666',
                            fontSize: '16px'
                        }}>
                            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
                            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>No Users Found</h3>
                            <button 
                                onClick={fetchUsers}
                                style={{
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    marginTop: '15px'
                                }}
                            >
                                🔄 Refresh
                            </button>
                        </div>
                    ) : (
                        users.map((user, index) => (
                            <div 
                                key={user._id}
                                style={{ 
                                    padding: '20px',
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 2fr',
                                    gap: '15px',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #e9ecef',
                                    background: index % 2 === 0 ? '#f8f9fa' : 'white',
                                    transition: 'all 0.2s ease',
                                    fontSize: '14px'
                                }}
                            >
                                {/* User Info */}
                                <div>
                                    <div style={{ 
                                        fontWeight: '600', 
                                        color: '#333',
                                        fontSize: '15px',
                                        marginBottom: '5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span>👤</span>
                                        <span>{user.name}</span>
                                        {user._id === currentUser.id && (
                                            <span style={{
                                                background: '#667eea',
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                fontSize: '11px'
                                            }}>
                                                You
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ 
                                        color: '#666', 
                                        fontSize: '13px',
                                        marginBottom: '5px'
                                    }}>
                                        📧 {user.email}
                                    </div>
                                    <div style={{ 
                                        color: '#999', 
                                        fontSize: '12px'
                                    }}>
                                        📅 {formatDate(user.createdAt)}
                                    </div>
                                </div>
                                
                                {/* Role */}
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{
                                        background: user.role === 'admin' ? '#dc3545' : '#28a745',
                                        color: 'white',
                                        padding: '8px 15px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'inline-block'
                                    }}>
                                        {user.role}
                                    </span>
                                </div>
                                
                                {/* Credits */}
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{
                                        background: user.skillCredits > 50 ? '#d4edda' : user.skillCredits > 0 ? '#fff3cd' : '#f8d7da',
                                        color: user.skillCredits > 50 ? '#155724' : user.skillCredits > 0 ? '#856404' : '#721c24',
                                        padding: '8px 15px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'inline-block'
                                    }}>
                                        💰 {user.skillCredits}
                                    </span>
                                </div>
                                
                                {/* Reputation */}
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{
                                        background: user.reputationScore > 50 ? '#d4edda' : user.reputationScore > 0 ? '#fff3cd' : '#f8f9fa',
                                        color: user.reputationScore > 50 ? '#155724' : user.reputationScore > 0 ? '#856404' : '#666',
                                        padding: '8px 15px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'inline-block'
                                    }}>
                                        ⭐ {user.reputationScore}
                                    </span>
                                </div>
                                
                                {/* Skills */}
                                <div style={{ textAlign: 'center' }}>
                                    <button 
                                        onClick={() => handleEditSkillsClick(user)}
                                        style={{
                                            background: '#17a2b8',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 15px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            width: '100%',
                                            marginBottom: '5px'
                                        }}
                                    >
                                        Edit Skills
                                    </button>
                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                        🎯{user.teachSkills.length} | 📚{user.learnSkills.length}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button 
                                            onClick={() => handleEditClick(user)}
                                            style={{
                                                background: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '5px'
                                            }}
                                        >
                                            ✏️ Edit User
                                        </button>
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
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '5px'
                                            }}
                                        >
                                            🔑 Change Password
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(user)}
                                            disabled={user._id === currentUser?.id}
                                            style={{
                                                background: user._id === currentUser?.id ? '#ccc' : '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                cursor: user._id === currentUser?.id ? 'not-allowed' : 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                opacity: user._id === currentUser?.id ? 0.5 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '5px'
                                            }}
                                            title={user._id === currentUser?.id ? "Cannot delete your own account" : "Delete user"}
                                        >
                                            🗑️ Delete User
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '15px',
                marginTop: '30px'
            }}>
                <button 
                    onClick={fetchUsers}
                    style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '12px 25px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    🔄 Refresh Data
                </button>
            </div>

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
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
                        <h3>✏️ Edit User: {editingUser.name}</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Role</label>
                            <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Skill Credits</label>
                            <input
                                type="number"
                                value={editForm.skillCredits}
                                onChange={(e) => setEditForm({...editForm, skillCredits: parseInt(e.target.value) || 0})}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Reputation Score</label>
                            <input
                                type="number"
                                value={editForm.reputationScore}
                                onChange={(e) => setEditForm({...editForm, reputationScore: parseInt(e.target.value) || 0})}
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
                                onClick={() => setShowEditModal(false)}
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
                                onClick={handleSaveEdit}
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
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && userToDelete && (
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
                        <h3 style={{ color: '#dc3545' }}>⚠️ Delete User</h3>
                        <p>Are you sure you want to delete user <strong>{userToDelete.name}</strong> ({userToDelete.email})?</p>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            This action cannot be undone. All swap requests associated with this user will also be deleted.
                        </p>
                        
                        {userToDelete.role === 'admin' && (
                            <div style={{
                                background: '#fff3cd',
                                color: '#856404',
                                padding: '10px',
                                borderRadius: '6px',
                                margin: '15px 0',
                                fontSize: '14px',
                                border: '1px solid #ffeaa7'
                            }}>
                                ⚠️ This user is an administrator!
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button 
                                onClick={() => setShowDeleteModal(false)}
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
                                onClick={handleConfirmDelete}
                                style={{
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Skills Modal */}
            {showSkillsModal && selectedUserSkills && (
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
                        width: '500px',
                        maxWidth: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <h3>🎯 Edit Skills: {selectedUserSkills.name}</h3>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Skills to Teach (comma-separated)</label>
                            <input
                                type="text"
                                value={skillsForm.teachSkills.join(', ')}
                                onChange={(e) => setSkillsForm({
                                    ...skillsForm, 
                                    teachSkills: e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill)
                                })}
                                placeholder="e.g., JavaScript, React, Node.js"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px'
                                }}
                            />
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                Current: {skillsForm.teachSkills.length} skills
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Skills to Learn (comma-separated)</label>
                            <input
                                type="text"
                                value={skillsForm.learnSkills.join(', ')}
                                onChange={(e) => setSkillsForm({
                                    ...skillsForm, 
                                    learnSkills: e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill)
                                })}
                                placeholder="e.g., Python, Machine Learning, Data Science"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px'
                                }}
                            />
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                Current: {skillsForm.learnSkills.length} skills
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setShowSkillsModal(false)}
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
                                onClick={handleSaveSkills}
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
                                Save Skills
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && selectedUserPassword && (
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
                            🔑 Change Password for {selectedUserPassword.name}
                        </h3>
                        
                        {selectedUserPassword._id === currentUser.id && (
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
                                    setSelectedUserPassword(null);
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

            {/* Footer Info */}
            <div style={{
                marginTop: '30px',
                padding: '20px',
                background: 'white',
                borderRadius: '10px',
                textAlign: 'left',
                color: '#666',
                fontSize: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h4 style={{ marginTop: 0, color: '#333' }}>💡 Admin Permissions:</h4>
                <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                    <li>Edit user roles and permissions</li>
                    <li>Modify skill credits and reputation scores</li>
                    <li>Edit user skills (both teaching and learning)</li>
                    <li>Change any user's password (including your own)</li>
                    <li>Delete users from the system</li>
                    <li>View detailed user information</li>
                </ul>
                <div style={{ 
                    background: '#f8f9fa', 
                    padding: '10px', 
                    borderRadius: '6px',
                    marginTop: '10px',
                    fontSize: '13px'
                }}>
                    <strong>⚠️ Important:</strong> When changing your own password, you will be logged out and need to login again with the new password.
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
