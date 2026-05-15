import React, { useState, useEffect } from 'react'

const Profile = ({ user, onUpdate }) => {
    const [teachSkills, setTeachSkills] = useState([])
    const [learnSkills, setLearnSkills] = useState([])
    const [newSkill, setNewSkill] = useState({ type: 'teach', name: '' })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState({ teach: '', learn: '' })
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchUserSkills();
    }, [user.id]);

    const fetchUserSkills = async () => {
        try {
            console.log('🔄 Fetching user skills from MongoDB...');
            const response = await fetch(`http://32.198.132.159:5000/api/users/${user.id}`);
            const data = await response.json();
            
            if (data.success && data.user) {
                console.log('✅ Skills fetched:', {
                    teach: data.user.teachSkills,
                    learn: data.user.learnSkills
                });
                setTeachSkills(data.user.teachSkills || []);
                setLearnSkills(data.user.learnSkills || []);
                
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

    const validateSkill = (skill) => {
        if (!skill.trim()) return 'Skill cannot be empty';
        if (/\d/.test(skill)) return '❌ Skill cannot contain numbers';
        if (skill.trim().length < 2) return 'Skill must be at least 2 characters';
        return '';
    };

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

    const removeSkill = (type, index) => {
        if (type === 'teach') {
            setTeachSkills(teachSkills.filter((_, i) => i !== index));
        } else {
            setLearnSkills(learnSkills.filter((_, i) => i !== index));
        }
    };

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
            
            const response = await fetch(`http://32.198.132.159:5000/api/users/${user.id}/skills`, {
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
                const savedUser = localStorage.getItem('skillswap_user');
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    userData.teachSkills = teachSkills;
                    userData.learnSkills = learnSkills;
                    localStorage.setItem('skillswap_user', JSON.stringify(userData));
                }

                setMessage('✅ Skills saved successfully!');
                
                if (onUpdate) {
                    onUpdate(data.user);
                }

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

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill(e);
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: isMobile ? '15px' : '20px', color: '#333', fontSize: isMobile ? '1.3rem' : '1.5rem' }}>Manage Your Profile</h2>
            
            {message && (
                <div style={{
                    background: message.includes('✅') ? '#d4edda' : '#f8d7da',
                    color: message.includes('✅') ? '#155724' : '#721c24',
                    padding: isMobile ? '10px' : '12px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
                    fontSize: isMobile ? '12px' : '14px',
                    textAlign: 'center'
                }}>
                    {message}
                </div>
            )}
            
            <div className="stat-card" style={{ marginBottom: isMobile ? '15px' : '30px', padding: isMobile ? '15px' : '20px' }}>
                <h3 style={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>Quick Stats</h3>
                <p style={{ fontSize: isMobile ? '12px' : '14px' }}>Complete your profile to get better matches!</p>
                <div style={{ display: 'flex', gap: isMobile ? '15px' : '20px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <div>
                        <strong>To Teach:</strong> {teachSkills.length} skills
                    </div>
                    <div>
                        <strong>To Learn:</strong> {learnSkills.length} skills
                    </div>
                </div>
            </div>

            {/* Add New Skill - Mobile Responsive */}
            <div className="module-card" style={{ marginBottom: isMobile ? '15px' : '20px', padding: isMobile ? '15px' : '20px' }}>
                <h3 style={{ fontSize: isMobile ? '1rem' : '1.2rem' }}>Add New Skill</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: '10px', 
                        width: '100%' 
                    }}>
                        <select 
                            value={newSkill.type}
                            onChange={(e) => setNewSkill({...newSkill, type: e.target.value})}
                            style={{ 
                                width: isMobile ? '100%' : 'auto',
                                padding: isMobile ? '10px' : '12px'
                            }}
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
                                if (newSkill.type === 'teach') {
                                    setError({...error, teach: ''});
                                } else {
                                    setError({...error, learn: ''});
                                }
                            }}
                            onKeyPress={handleKeyPress}
                            style={{ 
                                flex: 1,
                                padding: isMobile ? '10px' : '12px',
                                width: isMobile ? '100%' : 'auto'
                            }}
                        />
                        <button 
                            className="btn" 
                            onClick={addSkill}
                            style={{ 
                                width: isMobile ? '100%' : 'auto',
                                padding: isMobile ? '10px' : '12px'
                            }}
                        >
                            Add Skill
                        </button>
                    </div>
                    
                    {newSkill.type === 'teach' && error.teach && (
                        <div style={{
                            color: '#dc3545',
                            fontSize: '12px',
                            marginTop: '5px',
                            padding: '8px',
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
                            fontSize: '12px',
                            marginTop: '5px',
                            padding: '8px',
                            background: '#f8d7da',
                            borderRadius: '4px',
                            width: '100%'
                        }}>
                            {error.learn}
                        </div>
                    )}
                </div>
                <p style={{ fontSize: '11px', color: '#666', marginTop: '10px' }}>
                    ⚠️ Numbers are not allowed in skill names
                </p>
            </div>

            {/* Skills to Teach */}
            <div className="module-card" style={{ marginBottom: isMobile ? '15px' : '20px', padding: isMobile ? '15px' : '20px' }}>
                <h3 style={{ color: '#28a745', fontSize: isMobile ? '1rem' : '1.2rem' }}>Skills I Can Teach</h3>
                <div className="skill-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                    {teachSkills.map((skill, index) => (
                        <div key={index} className="skill-tag teach" style={{
                            background: '#d4edda',
                            color: '#155724',
                            padding: isMobile ? '6px 12px' : '5px 12px',
                            borderRadius: '20px',
                            fontSize: isMobile ? '12px' : '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {skill}
                            <span 
                                style={{ 
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: isMobile ? '16px' : '18px',
                                    color: '#721c24'
                                }}
                                onClick={() => removeSkill('teach', index)}
                            >
                                ×
                            </span>
                        </div>
                    ))}
                    {teachSkills.length === 0 && (
                        <p style={{ color: '#666', fontStyle: 'italic', fontSize: isMobile ? '12px' : '14px' }}>
                            No skills added yet. Add skills you can teach to start swapping!
                        </p>
                    )}
                </div>
            </div>

            {/* Skills to Learn */}
            <div className="module-card" style={{ marginBottom: isMobile ? '15px' : '20px', padding: isMobile ? '15px' : '20px' }}>
                <h3 style={{ color: '#dc3545', fontSize: isMobile ? '1rem' : '1.2rem' }}>Skills I Want to Learn</h3>
                <div className="skill-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                    {learnSkills.map((skill, index) => (
                        <div key={index} className="skill-tag learn" style={{
                            background: '#f8d7da',
                            color: '#721c24',
                            padding: isMobile ? '6px 12px' : '5px 12px',
                            borderRadius: '20px',
                            fontSize: isMobile ? '12px' : '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {skill}
                            <span 
                                style={{ 
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: isMobile ? '16px' : '18px'
                                }}
                                onClick={() => removeSkill('learn', index)}
                            >
                                ×
                            </span>
                        </div>
                    ))}
                    {learnSkills.length === 0 && (
                        <p style={{ color: '#666', fontStyle: 'italic', fontSize: isMobile ? '12px' : '14px' }}>
                            Add skills you want to learn to find perfect partners!
                        </p>
                    )}
                </div>
            </div>

            {/* Save Button */}
            <div className="module-card" style={{ padding: isMobile ? '15px' : '20px' }}>
                <button 
                    className="btn" 
                    onClick={saveSkills}
                    disabled={loading}
                    style={{ 
                        background: loading ? '#6c757d' : '#28a745',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        width: '100%',
                        padding: isMobile ? '12px' : '15px',
                        fontSize: isMobile ? '14px' : '16px'
                    }}
                >
                    {loading ? 'Saving...' : '💾 Save Skills to Database'}
                </button>
                <p style={{ marginTop: '10px', fontSize: isMobile ? '11px' : '14px', color: '#666', textAlign: 'center' }}>
                    Your skills will appear in Skill Matching after saving.
                </p>
            </div>
        </div>
    )
}

export default Profile