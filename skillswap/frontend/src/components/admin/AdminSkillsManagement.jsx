import React, { useState, useEffect } from 'react';

const AdminSkillsManagement = () => {
    const [allSkills, setAllSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [skillStats, setSkillStats] = useState(null);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchAllSkills();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const fetchAllSkills = async () => {
        try {
            const response = await fetch('http://32.198.132.159:5000/api/admin/skills/all');
            const data = await response.json();
            if (data.success) {
                setAllSkills(data.skills);
                setSkillStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching skills:', error);
            showNotification('Failed to fetch skills', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSkill = async (skillName) => {
        if (!window.confirm(`Are you sure you want to remove "${skillName}" from all users?`)) {
            return;
        }

        try {
            const response = await fetch('http://32.198.132.159:5000/api/admin/skills/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skill: skillName })
            });
            const data = await response.json();
            if (data.success) {
                showNotification(`✅ Skill "${skillName}" removed successfully`);
                fetchAllSkills();
            } else {
                showNotification(data.message || 'Failed to remove skill', 'error');
            }
        } catch (error) {
            console.error('Error removing skill:', error);
            showNotification('Failed to remove skill', 'error');
        }
    };

    const filteredSkills = allSkills.filter(skill => 
        skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                Loading skills...
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

            {/* Stats Cards */}
            {skillStats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>📚</div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#0066cc' }}>{skillStats.totalSkills}</div>
                        <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>Total Skills</div>
                    </div>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>🎯</div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#28a745' }}>{skillStats.mostTaught || '-'}</div>
                        <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>Most Taught</div>
                    </div>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>📖</div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc3545' }}>{skillStats.mostLearned || '-'}</div>
                        <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>Most Wanted</div>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Search skills..."
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

            {/* Skills Table */}
            <div style={{
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                overflow: 'auto'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Skill Name</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Teaching</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Learning</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Total Users</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSkills.map((skill, index) => (
                            <tr key={skill.name} style={{ borderBottom: index === filteredSkills.length - 1 ? 'none' : '1px solid #e9ecef' }}>
                                <td style={{ padding: '12px', fontWeight: '500', fontSize: '14px' }}>
                                    {skill.name}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#28a745', fontWeight: '500' }}>
                                    {skill.teachCount || 0}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#dc3545', fontWeight: '500' }}>
                                    {skill.learnCount || 0}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#0066cc' }}>
                                    {skill.count}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => handleRemoveSkill(skill.name)}
                                        style={{
                                            padding: '5px 12px',
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredSkills.length === 0 && (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '50px', 
                    background: 'white', 
                    borderRadius: '8px', 
                    border: '1px solid #e9ecef' 
                }}>
                    <p style={{ color: '#6c757d' }}>No skills found matching your search.</p>
                </div>
            )}
        </div>
    );
};

export default AdminSkillsManagement;
