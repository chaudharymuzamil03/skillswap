// AdminUsersList.jsx - Simple Professional Version
import React, { useState, useEffect } from 'react';

const AdminUsersList = ({ currentUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSkillsModal, setShowSkillsModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [editForm, setEditForm] = useState({ role: '', skillCredits: 0, reputationScore: 0 });
    const [skillsForm, setSkillsForm] = useState({ teachSkills: [], learnSkills: [] });
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://32.198.132.159:5000/api/admin/users');
            const data = await response.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            showNotification('Failed to fetch users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setEditForm({
            role: user.role,
            skillCredits: user.skillCredits,
            reputationScore: user.reputationScore
        });
        setShowEditModal(true);
    };

    const handleEditSkills = (user) => {
        setSelectedUser(user);
        setSkillsForm({
            teachSkills: [...(user.teachSkills || [])],
            learnSkills: [...(user.learnSkills || [])]
        });
        setShowSkillsModal(true);
    };

    const handleUpdateUser = async () => {
        try {
            const response = await fetch(`http://32.198.132.159:5000/api/admin/users/${selectedUser._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const data = await response.json();
            if (data.success) {
                showNotification('User updated successfully');
                fetchUsers();
                setShowEditModal(false);
            } else {
                showNotification(data.message || 'Failed to update user', 'error');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            showNotification('Failed to update user', 'error');
        }
    };

    const handleUpdateSkills = async () => {
        try {
            const response = await fetch(`http://32.198.132.159:5000/api/admin/users/${selectedUser._id}/skills`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(skillsForm)
            });
            const data = await response.json();
            if (data.success) {
                showNotification('Skills updated successfully');
                fetchUsers();
                setShowSkillsModal(false);
            } else {
                showNotification(data.message || 'Failed to update skills', 'error');
            }
        } catch (error) {
            console.error('Error updating skills:', error);
            showNotification('Failed to update skills', 'error');
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            const response = await fetch(`http://32.198.132.159:5000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentUserId: currentUser.id })
            });
            const data = await response.json();
            if (data.success) {
                showNotification('User deleted successfully');
                fetchUsers();
                setShowDeleteConfirm(null);
            } else {
                showNotification(data.message || 'Failed to delete user', 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('Failed to delete user', 'error');
        }
    };

    const handleResetPassword = async (userId) => {
        const newPassword = prompt('Enter new password for user (min 8 characters):');
        if (!newPassword) return;
        if (newPassword.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }
        try {
            const response = await fetch(`http://32.198.132.159:5000/api/admin/users/${userId}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            });
            const data = await response.json();
            if (data.success) {
                showNotification('Password reset successfully');
            } else {
                showNotification(data.message || 'Failed to reset password', 'error');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            showNotification('Failed to reset password', 'error');
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                Loading...
            </div>
        );
    }

    return (
        <div>
            {/* Notification */}
            {notification.show && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '12px 20px',
                    background: notification.type === 'success' ? '#28a745' : '#dc3545',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '14px',
                    zIndex: 9999,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                    {notification.message}
                </div>
            )}

            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 15px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                    }}
                />
            </div>

            {/* Users Table */}
            <div style={{
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                overflow: 'auto'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>User</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Role</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Credits</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Reputation</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Teach/Learn</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user, index) => (
                            <tr key={user._id} style={{ borderBottom: index === filteredUsers.length - 1 ? 'none' : '1px solid #e9ecef' }}>
                                <td style={{ padding: '12px' }}>
                                    <div>
                                        <div style={{ fontWeight: '500', fontSize: '14px', color: '#212529' }}>{user.name}</div>
                                        <div style={{ fontSize: '12px', color: '#6c757d' }}>{user.email}</div>
                                        {user._id === currentUser.id && (
                                            <span style={{ fontSize: '10px', background: '#e7f5ff', color: '#0066cc', padding: '2px 6px', borderRadius: '3px' }}>You</span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '3px 10px',
                                        borderRadius: '15px',
                                        fontSize: '12px',
                                        background: user.role === 'admin' ? '#dc3545' : '#28a745',
                                        color: 'white'
                                    }}>
                                        {user.role === 'admin' ? 'Admin' : 'User'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '500', fontSize: '14px' }}>
                                    {user.skillCredits}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '500', fontSize: '14px' }}>
                                    {user.reputationScore}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#6c757d' }}>
                                    🎯{user.teachSkills?.length || 0} | 📚{user.learnSkills?.length || 0}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <button 
                                            onClick={() => handleEditUser(user)}
                                            style={{ padding: '5px 12px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleEditSkills(user)}
                                            style={{ padding: '5px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                            Skills
                                        </button>
                                        <button 
                                            onClick={() => handleResetPassword(user._id)}
                                            style={{ padding: '5px 12px', background: '#ffc107', color: '#212529', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                            Reset PW
                                        </button>
                                        {user._id !== currentUser.id && (
                                            <button 
                                                onClick={() => setShowDeleteConfirm(user)}
                                                style={{ padding: '5px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredUsers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                    <p style={{ color: '#6c757d' }}>No users found</p>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '25px',
                        borderRadius: '8px',
                        width: '400px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>Edit User: {selectedUser.name}</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500' }}>Role</label>
                            <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500' }}>Skill Credits</label>
                            <input
                                type="number"
                                value={editForm.skillCredits}
                                onChange={(e) => setEditForm({...editForm, skillCredits: parseInt(e.target.value)})}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500' }}>Reputation Score</label>
                            <input
                                type="number"
                                value={editForm.reputationScore}
                                onChange={(e) => setEditForm({...editForm, reputationScore: parseInt(e.target.value)})}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowEditModal(false)} style={{ padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleUpdateUser} style={{ padding: '8px 20px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Update</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Skills Modal */}
            {showSkillsModal && selectedUser && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '25px',
                        borderRadius: '8px',
                        width: '500px',
                        maxWidth: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>Edit Skills: {selectedUser.name}</h3>
                        
                        {/* Teach Skills */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>🎯 Skills to Teach</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', minHeight: '50px' }}>
                                {skillsForm.teachSkills.map((skill, index) => (
                                    <span key={index} style={{ background: '#28a745', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        {skill}
                                        <button onClick={() => {
                                            const newSkills = [...skillsForm.teachSkills];
                                            newSkills.splice(index, 1);
                                            setSkillsForm({...skillsForm, teachSkills: newSkills});
                                        }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px' }}>×</button>
                                    </span>
                                ))}
                                {skillsForm.teachSkills.length === 0 && <span style={{ color: '#999', fontSize: '12px' }}>No teaching skills</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="text" id="newTeachSkill" placeholder="Add skill..." style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                                <button onClick={() => {
                                    const input = document.getElementById('newTeachSkill');
                                    if (input.value.trim()) {
                                        setSkillsForm({...skillsForm, teachSkills: [...skillsForm.teachSkills, input.value.trim()]});
                                        input.value = '';
                                    }
                                }} style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                            </div>
                        </div>

                        {/* Learn Skills */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>📚 Skills to Learn</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', minHeight: '50px' }}>
                                {skillsForm.learnSkills.map((skill, index) => (
                                    <span key={index} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        {skill}
                                        <button onClick={() => {
                                            const newSkills = [...skillsForm.learnSkills];
                                            newSkills.splice(index, 1);
                                            setSkillsForm({...skillsForm, learnSkills: newSkills});
                                        }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px' }}>×</button>
                                    </span>
                                ))}
                                {skillsForm.learnSkills.length === 0 && <span style={{ color: '#999', fontSize: '12px' }}>No learning skills</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="text" id="newLearnSkill" placeholder="Add skill..." style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                                <button onClick={() => {
                                    const input = document.getElementById('newLearnSkill');
                                    if (input.value.trim()) {
                                        setSkillsForm({...skillsForm, learnSkills: [...skillsForm.learnSkills, input.value.trim()]});
                                        input.value = '';
                                    }
                                }} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowSkillsModal(false)} style={{ padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleUpdateSkills} style={{ padding: '8px 20px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Update Skills</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '25px',
                        borderRadius: '8px',
                        width: '350px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '40px', marginBottom: '15px' }}>⚠️</div>
                        <h3 style={{ margin: '0 0 10px' }}>Delete User?</h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                            Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>?
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => handleDeleteUser(showDeleteConfirm._id)} style={{ padding: '8px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersList;
