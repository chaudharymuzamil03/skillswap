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

    // AI Skill Matching Database
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
                let matchReason = '';

                const availableTeachSkills = otherUser.teachSkills?.filter(skill => !completedSkillsList.includes(skill)) || [];
                const availableLearnSkills = otherUser.learnSkills?.filter(skill => !completedSkillsList.includes(skill)) || [];

                availableTeachSkills.forEach(teachSkill => {
                    if (currentUser.learnSkills) {
                        currentUser.learnSkills.forEach(learnSkill => {
                            if (isAIMatch(teachSkill, learnSkill)) {
                                matchScore += 25;
                                teachSkillsMatched.push(teachSkill);
                                matchReason = `Can teach you "${teachSkill}"`;
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
                                if (!matchReason) matchReason = `Wants to learn "${learnSkill}" from you`;
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
                    matchReason,
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
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '32px' }}>🤖</div>
                <div style={{ marginTop: '10px', color: '#666' }}>Finding your matches...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: isMobile ? '12px' : '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', color: '#1b1f23' }}>AI Skill Matching</h2>
                <p style={{ margin: '4px 0 0', fontSize: isMobile ? '12px' : '14px', color: '#65676b' }}>AI-powered matching • Find your perfect skill swap partner</p>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '16px' }}>
                <input
                    type="text"
                    placeholder="🔍 Search users or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: isMobile ? '10px 14px' : '12px 16px',
                        fontSize: isMobile ? '14px' : '15px',
                        border: '1px solid #dddfe2',
                        borderRadius: '20px',
                        outline: 'none',
                        background: '#f0f2f5'
                    }}
                />
            </div>

            {error && (
                <div style={{ background: '#fee', color: '#c00', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
                    {error}
                    <button onClick={fetchMatches} style={{ marginLeft: '10px', background: '#c00', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '5px', cursor: 'pointer' }}>Retry</button>
                </div>
            )}

            {/* Facebook Style Suggestions Grid */}
            {filteredMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
                    <div style={{ fontSize: '48px' }}>🔍</div>
                    <h3 style={{ marginTop: '10px' }}>No matches found</h3>
                    <p style={{ color: '#666' }}>Try adding more skills to your profile</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    gap: '12px'
                }}>
                    {filteredMatches.map((match) => (
                        <div
                            key={match._id}
                            style={{
                                background: 'white',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                transition: 'transform 0.2s'
                            }}
                        >
                            {/* Avatar */}
                            <div style={{
                                background: `linear-gradient(135deg, #667eea, #764ba2)`,
                                padding: isMobile ? '16px' : '20px',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    width: isMobile ? '60px' : '70px',
                                    height: isMobile ? '60px' : '70px',
                                    borderRadius: '50%',
                                    background: 'white',
                                    margin: '0 auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: isMobile ? '28px' : '32px',
                                    fontWeight: 'bold',
                                    color: '#667eea'
                                }}>
                                    {match.name ? match.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                            </div>

                            {/* Info */}
                            <div style={{ padding: isMobile ? '12px' : '14px', textAlign: 'center' }}>
                                <h3 style={{ margin: '0 0 4px', fontSize: isMobile ? '14px' : '16px', fontWeight: '600' }}>
                                    {match.name || 'User'}
                                </h3>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '8px', fontSize: '11px', color: '#65676b' }}>
                                    <span>⭐ {match.reputationScore}</span>
                                    <span>💰 {match.skillCredits}</span>
                                </div>

                                {match.matchReason && (
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#1877f2',
                                        background: '#e7f3ff',
                                        padding: '4px 8px',
                                        borderRadius: '15px',
                                        display: 'inline-block',
                                        marginBottom: '10px'
                                    }}>
                                        {match.matchReason}
                                    </div>
                                )}

                                {match.teachSkillsMatched && match.teachSkillsMatched.length > 0 && (
                                    <div style={{ marginBottom: '8px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#28a745', marginBottom: '3px' }}>Can teach:</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px' }}>
                                            {match.teachSkillsMatched.slice(0, 2).map((skill, i) => (
                                                <span key={i} style={{
                                                    background: '#d4edda',
                                                    color: '#155724',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '9px'
                                                }}>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {match.learnSkillsMatched && match.learnSkillsMatched.length > 0 && (
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#dc3545', marginBottom: '3px' }}>Wants to learn:</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px' }}>
                                            {match.learnSkillsMatched.slice(0, 2).map((skill, i) => (
                                                <span key={i} style={{
                                                    background: '#f8d7da',
                                                    color: '#721c24',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '9px'
                                                }}>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Match Percentage */}
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: match.matchScore > 70 ? '#28a745' : match.matchScore > 40 ? '#ffc107' : '#6c757d',
                                    marginBottom: '10px'
                                }}>
                                    {match.matchScore}% Match
                                </div>

                                {/* Buttons */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => alert(`📱 Profile\n\nName: ${match.name}\nEmail: ${match.email}\n⭐ Reputation: ${match.reputationScore}\n💰 Credits: ${match.skillCredits}\n\n🎯 Skills to Teach: ${match.teachSkills?.join(', ') || 'None'}\n📚 Skills to Learn: ${match.learnSkills?.join(', ') || 'None'}`)}
                                        style={{
                                            flex: 1,
                                            padding: isMobile ? '6px' : '8px',
                                            background: '#e4e6eb',
                                            color: '#050505',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: isMobile ? '11px' : '12px',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => openRequestModal(match)}
                                        disabled={pendingRequests[match._id] || !match.teachSkillsMatched?.length}
                                        style={{
                                            flex: 1,
                                            padding: isMobile ? '6px' : '8px',
                                            background: pendingRequests[match._id] ? '#42b72a' : (match.teachSkillsMatched?.length > 0 ? '#1877f2' : '#e4e6eb'),
                                            color: pendingRequests[match._id] ? 'white' : (match.teachSkillsMatched?.length > 0 ? 'white' : '#8a8d91'),
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: isMobile ? '11px' : '12px',
                                            fontWeight: '500',
                                            cursor: (pendingRequests[match._id] || !match.teachSkillsMatched?.length) ? 'default' : 'pointer'
                                        }}
                                    >
                                        {pendingRequests[match._id] ? '✓ Sent' : 'Request'}
                                    </button>
                                </div>

                                {match.teachSkillsMatched?.length > 0 && !pendingRequests[match._id] && (
                                    <div style={{
                                        marginTop: '8px',
                                        fontSize: '9px',
                                        color: '#856404',
                                        background: '#fff3cd',
                                        padding: '3px',
                                        borderRadius: '4px'
                                    }}>
                                        💰 {match.teachSkillsMatched.length * 10} credits
                                    </div>
                                )}
                            </div>
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
                        background: 'white', borderRadius: '12px', padding: isMobile ? '20px' : '25px',
                        width: isMobile ? '90%' : '400px', maxWidth: '90%'
                    }}>
                        <h3 style={{ marginBottom: '15px' }}>Send Request to {selectedUser.name}</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px', display: 'block' }}>Skills to Learn:</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {requestSkills.map((skill, i) => (
                                    <span key={i} style={{ background: '#28a745', color: 'white', padding: '4px 10px', borderRadius: '15px', fontSize: '11px' }}>{skill}</span>
                                ))}
                            </div>
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px', display: 'block' }}>Message:</label>
                            <textarea
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                rows="3"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '20px', background: '#f0f7ff', padding: '12px', borderRadius: '8px', fontSize: '12px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>💡 Summary:</div>
                            <div>• Skills: {requestSkills.length}</div>
                            <div>• Credits: {requestSkills.length * 10}</div>
                            <div>• Your balance: {user.skillCredits}</div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowRequestModal(false)} style={{ padding: '8px 16px', background: '#e4e6eb', color: '#050505', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={sendRequest} style={{ padding: '8px 16px', background: '#1877f2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Send Request</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillMatching;