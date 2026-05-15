import React, { useState, useEffect } from 'react';

const SkillMatching = ({ user }) => {
    const [potentialMatches, setPotentialMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [pendingRequests, setPendingRequests] = useState({});
    const [requestMessage, setRequestMessage] = useState('');
    const [requestSkills, setRequestSkills] = useState([]);
    const [completedSkills, setCompletedSkills] = useState([]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // ========== AI SKILL DATABASE (same) ==========
    const skillDatabase = {
        'javascript': ['js', 'javascript', 'ecmascript', 'node.js'],
        'python': ['python', 'py', 'python3', 'django'],
        'java': ['java', 'java8', 'spring', 'spring boot'],
        'machine learning': ['ml', 'machine learning', 'machinelearning', 'deep learning'],
        'ml': ['machine learning', 'ml', 'deep learning'],
        'artificial intelligence': ['ai', 'artificial intelligence'],
        'ai': ['artificial intelligence', 'ai'],
        'web development': ['web dev', 'web development', 'frontend', 'backend'],
        'frontend': ['frontend', 'front-end', 'front end', 'react', 'angular', 'vue'],
        'backend': ['backend', 'back-end', 'back end', 'api', 'node.js'],
        'app development': ['app dev', 'app development', 'mobile app', 'android', 'ios'],
        'android': ['android', 'android dev', 'android development', 'kotlin'],
        'ios': ['ios', 'ios dev', 'ios development', 'swift']
    };

    const isAIMatch = (skill1, skill2) => {
        if (!skill1 || !skill2) return false;
        const s1 = skill1.toLowerCase().trim();
        const s2 = skill2.toLowerCase().trim();
        if (s1 === s2) return true;
        if (s1.includes(s2) || s2.includes(s1)) return true;
        for (const [mainSkill, synonyms] of Object.entries(skillDatabase)) {
            const isS1Match = (s1 === mainSkill || synonyms.includes(s1));
            const isS2Match = (s2 === mainSkill || synonyms.includes(s2));
            if (isS1Match && isS2Match) return true;
        }
        return false;
    };

    const fetchCompletedSkills = async () => {
        try {
            const response = await fetch(`http://32.198.132.159:5000/api/users/${user.id}/sessions`);
            const data = await response.json();
            if (data.success && data.progress) {
                const completed = data.progress.filter(p => p.status === 'completed').map(p => p.skill);
                setCompletedSkills(completed);
                return completed;
            }
        } catch (error) {
            console.error('Error fetching completed skills:', error);
        }
        return [];
    };

    const calculateMatches = (otherUsers, currentUser, completedSkillsList) => {
        return otherUsers
            .filter(u => u.role !== 'admin' && u._id !== currentUser._id)
            .map(otherUser => {
                let matchScore = 0;
                const teachSkillsMatched = [];
                const learnSkillsMatched = [];

                const availableTeachSkills = otherUser.teachSkills?.filter(skill => !completedSkillsList.includes(skill)) || [];
                const availableLearnSkills = otherUser.learnSkills?.filter(skill => !completedSkillsList.includes(skill)) || [];

                availableTeachSkills.forEach(teachSkill => {
                    if (currentUser.learnSkills) {
                        currentUser.learnSkills.forEach(learnSkill => {
                            if (isAIMatch(teachSkill, learnSkill)) {
                                matchScore += 25;
                                teachSkillsMatched.push(teachSkill);
                            }
                        });
                    }
                });

                availableLearnSkills.forEach(learnSkill => {
                    if (currentUser.teachSkills) {
                        currentUser.teachSkills.forEach(teachSkill => {
                            if (isAIMatch(learnSkill, teachSkill)) {
                                matchScore += 25;
                                learnSkillsMatched.push(learnSkill);
                            }
                        });
                    }
                });

                if (otherUser.reputationScore && otherUser.reputationScore > 20) matchScore += 10;

                return {
                    ...otherUser,
                    matchScore: Math.min(matchScore, 100),
                    teachSkillsMatched,
                    learnSkillsMatched,
                    reputationScore: otherUser.reputationScore || 4.5,
                    skillCredits: otherUser.skillCredits || 50
                };
            })
            .sort((a, b) => b.matchScore - a.matchScore)
            .filter(u => u.matchScore > 0);
    };

    const fetchMatches = async () => {
        try {
            setLoading(true);
            setError('');
            const completedSkillsList = await fetchCompletedSkills();
            const response = await fetch('http://32.198.132.159:5000/api/matching/users');
            const data = await response.json();
            
            if (data.success && data.users) {
                const otherUsers = data.users.filter(u => u._id !== user.id);
                const matches = calculateMatches(otherUsers, user, completedSkillsList);
                setPotentialMatches(matches);
            } else {
                setError('Failed to load users');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error connecting to server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.id) fetchMatches();
    }, [user]);

    const filteredMatches = potentialMatches.filter(match => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (match.name && match.name.toLowerCase().includes(term)) ||
               (match.teachSkills && match.teachSkills.some(s => s && s.toLowerCase().includes(term))) ||
               (match.learnSkills && match.learnSkills.some(s => s && s.toLowerCase().includes(term)));
    });

    const openRequestModal = (matchUser) => {
        if (pendingRequests[matchUser._id]) {
            alert('Request already sent to this user!');
            return;
        }
        setSelectedUser(matchUser);
        setRequestSkills(matchUser.teachSkillsMatched);
        setRequestMessage(`Hi ${matchUser.name}! I'd like to learn ${matchUser.teachSkillsMatched.join(', ')} from you.`);
        setShowRequestModal(true);
    };

    const sendRequest = async () => {
        try {
            const creditRequired = requestSkills.length * 10;
            if (user.skillCredits < creditRequired) {
                alert(`❌ Insufficient credits! Need ${creditRequired} credits`);
                return;
            }
            
            const response = await fetch('http://32.198.132.159:5000/api/matching/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromUserId: user.id,
                    toUserId: selectedUser._id,
                    proposedSkills: requestSkills,
                    message: requestMessage,
                    scheduledDate: null
                })
            });
            
            const data = await response.json();
            if (data.success) {
                alert('✅ Swap request sent successfully!');
                setPendingRequests(prev => ({ ...prev, [selectedUser._id]: true }));
                setShowRequestModal(false);
                setSelectedUser(null);
                fetchMatches();
            } else {
                alert(`❌ Failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error sending request.');
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>🤖 Finding your matches...</div>;
    }

    // ========== MOBILE VERSION - SIMPLE GRID (NO CARDS, NO PERCENTAGE) ==========
    if (isMobile) {
        return (
            <div style={{ padding: '12px', background: '#f0f2f5', minHeight: '100vh' }}>
                {/* Header */}
                <div style={{ marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#1b1f23' }}>AI Skill Matching</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#65676b' }}>AI-powered matching • Find partners</p>
                </div>

                {/* Search */}
                <input
                    type="text"
                    placeholder="🔍 Search users or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: 'none',
                        borderRadius: '20px',
                        outline: 'none',
                        background: 'white',
                        marginBottom: '16px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                />

                {error && (
                    <div style={{ background: '#fee', color: '#c00', padding: '10px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', fontSize: '12px' }}>
                        {error}
                        <button onClick={fetchMatches} style={{ marginLeft: '10px', background: '#c00', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer' }}>Retry</button>
                    </div>
                )}

                {filteredMatches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
                        <div style={{ fontSize: '48px' }}>🔍</div>
                        <h3 style={{ marginTop: '10px', fontSize: '16px' }}>No matches found</h3>
                        <p style={{ color: '#666', fontSize: '12px' }}>Try adding more skills to your profile</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredMatches.map((match) => (
                            <div key={match._id} style={{
                                background: 'white',
                                borderRadius: '12px',
                                padding: '14px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}>
                                {/* User Info Row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: `linear-gradient(135deg, #667eea, #764ba2)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '20px',
                                        fontWeight: 'bold'
                                    }}>
                                        {match.name ? match.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{match.name || 'User'}</div>
                                        <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#65676b', marginTop: '2px' }}>
                                            <span>⭐ {match.reputationScore}</span>
                                            <span>💰 {match.skillCredits}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Skills Section */}
                                <div style={{ marginBottom: '12px' }}>
                                    {match.teachSkillsMatched && match.teachSkillsMatched.length > 0 && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ fontSize: '11px', color: '#28a745', fontWeight: 'bold', marginBottom: '4px' }}>🎯 Can teach:</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {match.teachSkillsMatched.map((skill, i) => (
                                                    <span key={i} style={{ background: '#d4edda', color: '#155724', padding: '4px 10px', borderRadius: '15px', fontSize: '11px' }}>{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {match.learnSkillsMatched && match.learnSkillsMatched.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#dc3545', fontWeight: 'bold', marginBottom: '4px' }}>📚 Wants to learn:</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {match.learnSkillsMatched.map((skill, i) => (
                                                    <span key={i} style={{ background: '#f8d7da', color: '#721c24', padding: '4px 10px', borderRadius: '15px', fontSize: '11px' }}>{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Buttons Row */}
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <button
                                        onClick={() => alert(`Profile: ${match.name}\nEmail: ${match.email}\n⭐ ${match.reputationScore}\n💰 ${match.skillCredits}\n\nTeach: ${match.teachSkills?.join(', ') || 'None'}\nLearn: ${match.learnSkills?.join(', ') || 'None'}`)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            background: '#e4e6eb',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        👤 Profile
                                    </button>
                                    <button
                                        onClick={() => openRequestModal(match)}
                                        disabled={pendingRequests[match._id] || !match.teachSkillsMatched?.length}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            background: pendingRequests[match._id] ? '#42b72a' : (match.teachSkillsMatched?.length > 0 ? '#1877f2' : '#e4e6eb'),
                                            color: pendingRequests[match._id] ? 'white' : (match.teachSkillsMatched?.length > 0 ? 'white' : '#8a8d91'),
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            cursor: (pendingRequests[match._id] || !match.teachSkillsMatched?.length) ? 'default' : 'pointer'
                                        }}
                                    >
                                        {pendingRequests[match._id] ? '✓ Sent' : '🤝 Request'}
                                    </button>
                                </div>

                                {/* Credits Info */}
                                {match.teachSkillsMatched?.length > 0 && !pendingRequests[match._id] && (
                                    <div style={{
                                        marginTop: '8px',
                                        fontSize: '10px',
                                        color: '#856404',
                                        background: '#fff3cd',
                                        padding: '4px',
                                        borderRadius: '6px',
                                        textAlign: 'center'
                                    }}>
                                        💰 {match.teachSkillsMatched.length * 10} credits
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Request Modal */}
                {showRequestModal && selectedUser && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white', borderRadius: '12px', padding: '20px',
                            width: '90%', maxWidth: '350px'
                        }}>
                            <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>Send Request to {selectedUser.name}</h3>
                            
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Skills to Learn:</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {requestSkills.map((skill, i) => (
                                        <span key={i} style={{ background: '#28a745', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '10px' }}>{skill}</span>
                                    ))}
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Message:</label>
                                <textarea
                                    value={requestMessage}
                                    onChange={(e) => setRequestMessage(e.target.value)}
                                    rows="3"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
                                />
                            </div>
                            
                            <div style={{ marginBottom: '15px', background: '#f0f7ff', padding: '10px', borderRadius: '8px', fontSize: '11px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>💡 Summary:</div>
                                <div>• Skills: {requestSkills.length}</div>
                                <div>• Credits: {requestSkills.length * 10}</div>
                                <div>• Your balance: {user.skillCredits}</div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowRequestModal(false)} style={{ padding: '6px 14px', background: '#e4e6eb', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={sendRequest} style={{ padding: '6px 14px', background: '#1877f2', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Send</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ========== LAPTOP VERSION - EXACTLY AS BEFORE (NO CHANGES) ==========
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '25px',
                color: 'white',
                marginBottom: '25px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px' }}>🎯 AI Skill Matching</h1>
                        <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '14px' }}>"ML" matches with "Machine Learning" • AI-powered matching</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px' }}>💰 {user.skillCredits || 50} Credits</div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px' }}>⭐ {user.reputationScore || 4.5} Rating</div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '25px' }}>
                <input
                    type="text"
                    placeholder="🔍 Search users or skills... (e.g., 'Python', 'ML', 'Machine Learning')"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 15px',
                        fontSize: '15px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
            </div>

            {error && (
                <div style={{
                    background: '#fee', color: '#c00', padding: '15px', borderRadius: '8px', marginBottom: '20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <span>❌ {error}</span>
                    <button onClick={fetchMatches} style={{ background: '#c00', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '5px', cursor: 'pointer' }}>Retry</button>
                </div>
            )}

            {filteredMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: '#f8f9fa', borderRadius: '12px' }}>
                    <div style={{ fontSize: '48px' }}>🔍</div>
                    <h3 style={{ marginTop: '10px' }}>No matches found</h3>
                    <p style={{ color: '#666' }}>Try adding more skills to your profile for better AI matching</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredMatches.map((match) => (
                        <div key={match._id} style={{
                            background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: match.matchScore > 80 ? '2px solid #28a745' : '1px solid #e0e0e0'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                                <div style={{ flex: 2 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                        <div style={{
                                            width: '50px', height: '50px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontSize: '20px', fontWeight: 'bold'
                                        }}>
                                            {match.name ? match.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '18px' }}>{match.name || 'User'}</h3>
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '4px', color: '#666', fontSize: '13px' }}>
                                                <span>⭐ {match.reputationScore}</span>
                                                <span>💰 {match.skillCredits} credits</span>
                                            </div>
                                        </div>
                                    </div>

                                    {match.teachSkillsMatched && match.teachSkillsMatched.length > 0 && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '13px', color: '#28a745' }}>🎯 Can teach you:</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {match.teachSkillsMatched.map((skill, i) => (
                                                    <span key={i} style={{ background: '#d4edda', color: '#155724', padding: '4px 10px', borderRadius: '15px', fontSize: '12px' }}>{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {match.learnSkillsMatched && match.learnSkillsMatched.length > 0 && (
                                        <div>
                                            <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '13px', color: '#dc3545' }}>📚 Wants to learn:</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {match.learnSkillsMatched.map((skill, i) => (
                                                    <span key={i} style={{ background: '#f8d7da', color: '#721c24', padding: '4px 10px', borderRadius: '15px', fontSize: '12px' }}>{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ minWidth: '180px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => alert(`Profile: ${match.name}\nEmail: ${match.email}\n⭐ ${match.reputationScore}\n💰 ${match.skillCredits}\n\nTeach: ${match.teachSkills?.join(', ') || 'None'}\nLearn: ${match.learnSkills?.join(', ') || 'None'}`)}
                                            style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>👤 Profile</button>
                                        <button onClick={() => openRequestModal(match)}
                                            disabled={pendingRequests[match._id] || !match.teachSkillsMatched || match.teachSkillsMatched.length === 0}
                                            style={{
                                                padding: '8px 16px',
                                                background: pendingRequests[match._id] ? '#28a745' : (match.teachSkillsMatched && match.teachSkillsMatched.length > 0 ? '#007bff' : '#ccc'),
                                                color: 'white', border: 'none', borderRadius: '6px',
                                                cursor: (pendingRequests[match._id] || !match.teachSkillsMatched || match.teachSkillsMatched.length === 0) ? 'default' : 'pointer',
                                                fontSize: '13px', fontWeight: '500', opacity: pendingRequests[match._id] ? 0.8 : 1
                                            }}>{pendingRequests[match._id] ? '✓ Sent' : '🤝 Request'}</button>
                                    </div>
                                    
                                    {match.teachSkillsMatched && match.teachSkillsMatched.length > 0 && !pendingRequests[match._id] && (
                                        <div style={{ marginTop: '10px', fontSize: '11px', color: '#856404', background: '#fff3cd', padding: '6px', borderRadius: '5px' }}>💰 {match.teachSkillsMatched.length * 10} credits</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showRequestModal && selectedUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '25px', width: '450px', maxWidth: '90%' }}>
                        <h3 style={{ marginBottom: '20px' }}>Send Request to {selectedUser.name}</h3>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Skills to Learn:</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {requestSkills.map((skill, i) => (<span key={i} style={{ background: '#28a745', color: 'white', padding: '4px 10px', borderRadius: '15px', fontSize: '12px' }}>{skill}</span>))}
                            </div>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Message:</label>
                            <textarea value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
                        </div>
                        <div style={{ marginBottom: '20px', background: '#f0f7ff', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>💡 Summary:</div>
                            <div>• Skills: {requestSkills.length}</div>
                            <div>• Credits: {requestSkills.length * 10}</div>
                            <div>• Your balance: {user.skillCredits}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowRequestModal(false)} style={{ padding: '8px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={sendRequest} style={{ padding: '8px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Send Request</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillMatching;