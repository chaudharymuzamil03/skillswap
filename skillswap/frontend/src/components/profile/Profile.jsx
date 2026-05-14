import React, { useState, useEffect } from 'react'

const Profile = ({ user, onUpdate }) => {
    const [teachSkills, setTeachSkills] = useState([])
    const [learnSkills, setLearnSkills] = useState([])
    const [newSkill, setNewSkill] = useState({ type: 'teach', name: '' })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState({ teach: '', learn: '' })

    // ============================================
    // Load skills from MongoDB on mount
    // ============================================
    useEffect(() => {
        fetchUserSkills();
    }, [user.id]);

    const fetchUserSkills = async () => {
        try {
            console.log('🔄 Fetching user skills from MongoDB...');
            const response = await fetch(`http://localhost:5000/api/users/${user.id}`);
            const data = await response.json();
            
            if (data.success && data.user) {
                console.log('✅ Skills fetched:', {
                    teach: data.user.teachSkills,
                    learn: data.user.learnSkills
                });
                setTeachSkills(data.user.teachSkills || []);
                setLearnSkills(data.user.learnSkills || []);
                
                // Update localStorage
                const savedUser = localStorage.getItem('skillswap_user');
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    userData.teachSkills = data.user.teachSkills || [];
                    userData.learnSkills = data.user.learnSkills || [];
                    localStorage.setItem('skillswap_user', JSON.stringify(userData));
                }
            }
        } catch (error) {
            console.error('❌ Error fetching skills:', error);
        }
    };

    // ============================================
    // Validate Skill - NO NUMBERS ALLOWED
    // ============================================
    const validateSkill = (skill) => {
        if (!skill.trim()) {
            return 'Skill cannot be empty';
        }
        if (/\d/.test(skill)) {
            return '❌ Skill cannot contain numbers';
        }
        if (skill.trim().length < 2) {
            return 'Skill must be at least 2 characters';
        }
        return '';
    };

    // ============================================
    // Add Skill with Validation
    // ============================================
    const addSkill = (e) => {
        e?.preventDefault();
        
        const validationError = validateSkill(newSkill.name);
        
        if (validationError) {
            if (newSkill.type === 'teach') {
                setError({ ...error, teach: validationError });
            } else {
                setError({ ...error, learn: validationError });
            }
            return;
        }

        // Check for duplicates
        if (newSkill.type === 'teach') {
            if (teachSkills.includes(newSkill.name.trim())) {
                setError({ ...error, teach: '❌ Skill already added' });
                return;
            }
            setTeachSkills([...teachSkills, newSkill.name.trim()]);
            setError({ ...error, teach: '' });
        } else {
            if (learnSkills.includes(newSkill.name.trim())) {
                setError({ ...error, learn: '❌ Skill already added' });
                return;
            }
            setLearnSkills([...learnSkills, newSkill.name.trim()]);
            setError({ ...error, learn: '' });
        }
        
        setNewSkill({ type: 'teach', name: '' });
    };

    // ============================================
    // Remove Skill
    // ============================================
    const removeSkill = (type, index) => {
        if (type === 'teach') {
            setTeachSkills(teachSkills.filter((_, i) => i !== index));
        } else {
            setLearnSkills(learnSkills.filter((_, i) => i !== index));
        }
    };

    // ============================================
    // Save Skills to MongoDB - NO PAGE REFRESH
    // ============================================
    const saveSkills = async (e) => {
        e?.preventDefault();
        
        setLoading(true);
        setMessage('');
        
        try {
            console.log('💾 Saving skills to MongoDB...', {
                userId: user.id,
                teach: teachSkills,
                learn: learnSkills
            });
            
            const response = await fetch(`http://localhost:5000/api/users/${user.id}/skills`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teachSkills: teachSkills,
                    learnSkills: learnSkills
                }),
            });
            
            const data = await response.json();
            console.log('📦 MongoDB Response:', data);
            
            if (data.success) {
                // Update localStorage
                const savedUser = localStorage.getItem('skillswap_user');
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    userData.teachSkills = teachSkills;
                    userData.learnSkills = learnSkills;
                    localStorage.setItem('skillswap_user', JSON.stringify(userData));
                }

                setMessage('✅ Skills saved successfully!');
                
                // Call onUpdate if provided
                if (onUpdate) {
                    onUpdate(data.user);
                }

                // Clear message after 3 seconds
                setTimeout(() => {
                    setMessage('');
                }, 3000);
            } else {
                setMessage('❌ Error: ' + (data.message || 'Failed to save skills'));
            }
        } catch (error) {
            console.error('❌ Save error:', error);
            setMessage('❌ Network error: Cannot connect to server');
        } finally {
            setLoading(false);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill(e);
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Manage Your Profile</h2>
            
            {/* Success/Error Message */}
            {message && (
                <div style={{
                    background: message.includes('✅') ? '#d4edda' : '#f8d7da',
                    color: message.includes('✅') ? '#155724' : '#721c24',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
                    fontSize: '14px'
                }}>
                    {message}
                </div>
            )}
            
            <div className="stat-card" style={{ marginBottom: '30px' }}>
                <h3>Quick Stats</h3>
                <p>Complete your profile to get better matches!</p>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                    <div>
                        <strong>To Teach:</strong> {teachSkills.length} skills
                    </div>
                    <div>
                        <strong>To Learn:</strong> {learnSkills.length} skills
                    </div>
                </div>
            </div>

            {/* Add New Skill */}
            <div className="module-card" style={{ marginBottom: '20px' }}>
                <h3>Add New Skill</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <select 
                            value={newSkill.type}
                            onChange={(e) => setNewSkill({...newSkill, type: e.target.value})}
                            style={{ width: 'auto' }}
                        >
                            <option value="teach">I Can Teach</option>
                            <option value="learn">I Want to Learn</option>
                        </select>
                        <input 
                            type="text"
                            placeholder="Enter skill name... (no numbers allowed)"
                            value={newSkill.name}
                            onChange={(e) => {
                                setNewSkill({...newSkill, name: e.target.value});
                                // Clear error when typing
                                if (newSkill.type === 'teach') {
                                    setError({...error, teach: ''});
                                } else {
                                    setError({...error, learn: ''});
                                }
                            }}
                            onKeyPress={handleKeyPress}
                            style={{ flex: 1 }}
                        />
                        <button 
                            className="btn" 
                            onClick={addSkill}
                            style={{ width: 'auto' }}
                        >
                            Add Skill
                        </button>
                    </div>
                    
                    {/* Validation Error Message */}
                    {newSkill.type === 'teach' && error.teach && (
                        <div style={{
                            color: '#dc3545',
                            fontSize: '13px',
                            marginTop: '5px',
                            padding: '5px 10px',
                            background: '#f8d7da',
                            borderRadius: '4px',
                            width: '100%'
                        }}>
                            {error.teach}
                        </div>
                    )}
                    {newSkill.type === 'learn' && error.learn && (
                        <div style={{
                            color: '#dc3545',
                            fontSize: '13px',
                            marginTop: '5px',
                            padding: '5px 10px',
                            background: '#f8d7da',
                            borderRadius: '4px',
                            width: '100%'
                        }}>
                            {error.learn}
                        </div>
                    )}
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    ⚠️ Numbers are not allowed in skill names
                </p>
            </div>

            {/* Skills to Teach */}
            <div className="module-card" style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#28a745' }}>Skills I Can Teach</h3>
                <div className="skill-tags">
                    {teachSkills.map((skill, index) => (
                        <div key={index} className="skill-tag teach">
                            {skill}
                            <span 
                                style={{ 
                                    marginLeft: '8px', 
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '18px'
                                }}
                                onClick={() => removeSkill('teach', index)}
                            >
                                ×
                            </span>
                        </div>
                    ))}
                    {teachSkills.length === 0 && (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>
                            No skills added yet. Add skills you can teach to start swapping!
                        </p>
                    )}
                </div>
            </div>

            {/* Skills to Learn */}
            <div className="module-card" style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#dc3545' }}>Skills I Want to Learn</h3>
                <div className="skill-tags">
                    {learnSkills.map((skill, index) => (
                        <div key={index} className="skill-tag learn">
                            {skill}
                            <span 
                                style={{ 
                                    marginLeft: '8px', 
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '18px'
                                }}
                                onClick={() => removeSkill('learn', index)}
                            >
                                ×
                            </span>
                        </div>
                    ))}
                    {learnSkills.length === 0 && (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>
                            Add skills you want to learn to find perfect partners!
                        </p>
                    )}
                </div>
            </div>

            {/* Save Button */}
            <div className="module-card">
                <button 
                    className="btn" 
                    onClick={saveSkills}
                    disabled={loading}
                    style={{ 
                        background: loading ? '#6c757d' : '#28a745',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        width: '100%'
                    }}
                >
                    {loading ? 'Saving...' : '💾 Save Skills to Database'}
                </button>
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                    Your skills will appear in Skill Matching after saving.
                </p>
            </div>
        </div>
    )
}

export default Profile