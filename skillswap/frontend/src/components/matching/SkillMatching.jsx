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
    const [completedSkills, setCompletedSkills] = useState([]); // NEW: Track completed skills

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
        'data science': ['data science', 'data analytics', 'data analysis'],
        'android': ['android', 'android dev', 'android development', 'kotlin'],
        'ios': ['ios', 'ios dev', 'ios development', 'swift'],
        'ui/ux': ['ui/ux', 'ui design', 'ux design', 'figma'],
        'graphic design': ['graphic design', 'photoshop', 'illustrator'],
        'video editing': ['video editing', 'premiere pro', 'final cut'],
        'project management': ['project management', 'agile', 'scrum', 'jira']
    };

    // AI Matching Function
    const isAIMatch = (skill1, skill2) => {
        if (!skill1 || !skill2) return false;
        
        const s1 = skill1.toLowerCase().trim();
        const s2 = skill2.toLowerCase().trim();
        
        // Exact match
        if (s1 === s2) return true;
        
        // Check if one contains the other
        if (s1.includes(s2) || s2.includes(s1)) return true;
        
        // Check synonym database
        for (const [mainSkill, synonyms] of Object.entries(skillDatabase)) {
            const isS1Match = (s1 === mainSkill || synonyms.includes(s1));
            const isS2Match = (s2 === mainSkill || synonyms.includes(s2));
            
            if (isS1Match && isS2Match) {
                return true;
            }
        }
        
        return false;
    };

    // NEW: Fetch completed skills for current user
    const fetchCompletedSkills = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/users/${user.id}/sessions`);
            const data = await response.json();
            
            if (data.success && data.progress) {
                const completed = data.progress
                    .filter(p => p.status === 'completed')
                    .map(p => p.skill);
                setCompletedSkills(completed);
                console.log('✅ Completed skills:', completed);
                return completed;
            }
        } catch (error) {
            console.error('Error fetching completed skills:', error);
        }
        return [];
    };

    // Calculate matches with completed skills filter
    const calculateMatches = (otherUsers, currentUser, completedSkillsList) => {
        return otherUsers
            .filter(u => {
                // Filter out admin users
                const isAdmin = u.role === 'admin' || 
                               u.email === 'admin@example.com' ||
                               u.name === 'Admin';
                return !isAdmin;
            })
            .map(otherUser => {
                let matchScore = 0;
                const teachSkillsMatched = [];
                const learnSkillsMatched = [];
                const matchDetails = [];

                // NEW: Filter out completed skills from other user's teachSkills
                const availableTeachSkills = otherUser.teachSkills?.filter(
                    skill => !completedSkillsList.includes(skill)
                ) || [];
                
                // NEW: Filter out completed skills from other user's learnSkills
                const availableLearnSkills = otherUser.learnSkills?.filter(
                    skill => !completedSkillsList.includes(skill)
                ) || [];

                // Check what they can teach me (only non-completed skills)
                availableTeachSkills.forEach(teachSkill => {
                    if (currentUser.learnSkills && Array.isArray(currentUser.learnSkills)) {
                        currentUser.learnSkills.forEach(learnSkill => {
                            if (isAIMatch(teachSkill, learnSkill)) {
                                matchScore += 25;
                                teachSkillsMatched.push({
                                    skill: teachSkill,
                                    matchesWith: learnSkill
                                });
                                matchDetails.push(`Can teach you "${teachSkill}"`);
                            }
                        });
                    }
                });

                // Check what they want to learn from me (only non-completed skills)
                availableLearnSkills.forEach(learnSkill => {
                    if (currentUser.teachSkills && Array.isArray(currentUser.teachSkills)) {
                        currentUser.teachSkills.forEach(teachSkill => {
                            if (isAIMatch(learnSkill, teachSkill)) {
                                matchScore += 25;
                                learnSkillsMatched.push({
                                    skill: learnSkill,
                                    matchesWith: teachSkill
                                });
                                matchDetails.push(`Wants to learn "${learnSkill}" from you`);
                            }
                        });
                    }
                });

                // Reputation bonus
                if (otherUser.reputationScore && otherUser.reputationScore > 20) {
                    matchScore += 10;
                    matchDetails.push(`Highly rated user`);
                }

                return {
                    ...otherUser,
                    matchScore: Math.min(matchScore, 100),
                    teachSkillsMatched: teachSkillsMatched,
                    learnSkillsMatched: learnSkillsMatched,
                    matchDetails: matchDetails,
                    reputationScore: otherUser.reputationScore || 4.5,
                    skillCredits: otherUser.skillCredits || 50,
                    // NEW: Store original skills for reference
                    allTeachSkills: otherUser.teachSkills,
                    allLearnSkills: otherUser.learnSkills
                };
            })
            .sort((a, b) => b.matchScore - a.matchScore)
            .filter(u => u.matchScore > 0); // Only show users with active matches
    };

    // Fetch users
    const fetchMatches = async () => {
        try {
            setLoading(true);
            setError('');
            
            // NEW: First fetch completed skills
            const completedSkillsList = await fetchCompletedSkills();
            
            // Fetch all users
            const response = await fetch('http://localhost:5000/api/matching/users');
            const data = await response.json();
            
            if (data.success && data.users) {
                // Filter out current user
                const otherUsers = data.users.filter(u => u._id !== user.id);
                
                // Get pending requests to check status
                try {
                    const requestsRes = await fetch(`http://localhost:5000/api/users/${user.id}/swap-requests`);
                    const requestsData = await requestsRes.json();
                    
                    if (requestsData.success && requestsData.activeExchanges) {
                        const pending = {};
                        requestsData.activeExchanges.forEach(req => {
                            if (req.status === 'pending') {
                                pending[req.toUserId] = true;
                            }
                        });
                        setPendingRequests(pending);
                    }
                } catch (err) {
                    console.log('No pending requests found');
                }
                
                // NEW: Pass completed skills to calculateMatches
                const matches = calculateMatches(otherUsers, user, completedSkillsList);
                setPotentialMatches(matches);
                
                console.log(`✅ Found ${matches.length} active matches after filtering completed skills`);
            } else {
                setError('Failed to load users');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Error connecting to server. Make sure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.id) {
            fetchMatches();
        }
    }, [user]);

    // Filter by search
    const filteredMatches = potentialMatches.filter(match => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (match.name && match.name.toLowerCase().includes(term)) ||
               (match.teachSkills && match.teachSkills.some(s => s && s.toLowerCase().includes(term))) ||
               (match.learnSkills && match.learnSkills.some(s => s && s.toLowerCase().includes(term)));
    });

    // Open request modal
    const openRequestModal = (matchUser) => {
        if (pendingRequests[matchUser._id]) {
            alert('Request already sent to this user!');
            return;
        }
        
        setSelectedUser(matchUser);
        const skillsToLearn = matchUser.teachSkillsMatched.map(s => s.skill);
        setRequestSkills(skillsToLearn);
        setRequestMessage(`Hi ${matchUser.name}! I'd like to learn ${skillsToLearn.join(', ')} from you. Would you be available for skill exchange?`);
        setShowRequestModal(true);
    };

    // Send swap request
    const sendRequest = async () => {
        try {
            const creditRequired = requestSkills.length * 10;
            
            if (user.skillCredits < creditRequired) {
                alert(`❌ Insufficient credits! Need ${creditRequired} credits, you have ${user.skillCredits}`);
                return;
            }
            
            const response = await fetch('http://localhost:5000/api/matching/request', {
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
                fetchMatches(); // Refresh
            } else {
                alert(`❌ Failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error sending request. Please try again.');
        }
    };

    // View profile
    const viewProfile = (matchUser) => {
        alert(`📱 User Profile\n\nName: ${matchUser.name}\nEmail: ${matchUser.email}\n⭐ Reputation: ${matchUser.reputationScore}\n💰 Credits: ${matchUser.skillCredits}\n\n🎯 Skills to Teach: ${matchUser.allTeachSkills?.join(', ') || 'None'}\n📚 Skills to Learn: ${matchUser.allLearnSkills?.join(', ') || 'None'}`);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <div style={{ fontSize: '40px' }}>🤖</div>
                <div style={{ marginTop: '10px', color: '#666' }}>AI is finding your perfect matches...</div>
            </div>
        );
    }

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
                        <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '14px' }}>
                            "ML" matches with "Machine Learning" • AI-powered matching
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px' }}>
                            💰 {user.skillCredits || 50} Credits
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px' }}>
                            ⭐ {user.reputationScore || 4.5} Rating
                        </div>
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
                        outline: 'none',
                        transition: 'border-color 0.3s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    background: '#fee',
                    color: '#c00',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>❌ {error}</span>
                    <button onClick={fetchMatches} style={{
                        background: '#c00',
                        color: 'white',
                        border: 'none',
                        padding: '6px 15px',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}>
                        Retry
                    </button>
                </div>
            )}

            {/* Users List */}
            {filteredMatches.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '50px',
                    background: '#f8f9fa',
                    borderRadius: '12px'
                }}>
                    <div style={{ fontSize: '48px' }}>🔍</div>
                    <h3 style={{ marginTop: '10px' }}>No matches found</h3>
                    <p style={{ color: '#666' }}>Try adding more skills to your profile for better AI matching</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredMatches.map((match) => (
                        <div
                            key={match._id}
                            style={{
                                background: 'white',
                                borderRadius: '10px',
                                padding: '20px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                border: match.matchScore > 80 ? '2px solid #28a745' : '1px solid #e0e0e0'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                                {/* Left Side - User Info */}
                                <div style={{ flex: 2 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
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
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '18px' }}>{match.name || 'User'}</h3>
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '4px', color: '#666', fontSize: '13px' }}>
                                                <span>⭐ {match.reputationScore}</span>
                                                <span>💰 {match.skillCredits} credits</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Match Details */}
                                    {match.matchDetails && match.matchDetails.length > 0 && (
                                        <div style={{
                                            background: '#f0f7ff',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            marginBottom: '12px'
                                        }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#667eea', fontSize: '13px' }}>
                                                🤖 AI Match:
                                            </div>
                                            {match.matchDetails.slice(0, 2).map((detail, i) => (
                                                <div key={i} style={{ fontSize: '12px', marginBottom: '4px', color: '#555' }}>
                                                    • {detail}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Skills They Can Teach */}
                                    {match.teachSkillsMatched && match.teachSkillsMatched.length > 0 && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '13px', color: '#28a745' }}>
                                                🎯 Can teach you:
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {match.teachSkillsMatched.map((skill, i) => (
                                                    <span key={i} style={{
                                                        background: '#d4edda',
                                                        color: '#155724',
                                                        padding: '4px 10px',
                                                        borderRadius: '15px',
                                                        fontSize: '12px'
                                                    }}>
                                                        {skill.skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Skills They Want to Learn */}
                                    {match.learnSkillsMatched && match.learnSkillsMatched.length > 0 && (
                                        <div>
                                            <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '13px', color: '#dc3545' }}>
                                                📚 Wants to learn:
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {match.learnSkillsMatched.map((skill, i) => (
                                                    <span key={i} style={{
                                                        background: '#f8d7da',
                                                        color: '#721c24',
                                                        padding: '4px 10px',
                                                        borderRadius: '15px',
                                                        fontSize: '12px'
                                                    }}>
                                                        {skill.skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* NEW: Show message if all skills completed */}
                                    {match.allTeachSkills?.length > 0 && match.teachSkillsMatched.length === 0 && match.learnSkillsMatched.length === 0 && (
                                        <div style={{
                                            marginTop: '10px',
                                            padding: '8px',
                                            background: '#e7f3ff',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            color: '#0066cc'
                                        }}>
                                            ✓ All matching skills already completed
                                        </div>
                                    )}
                                </div>

                                {/* Right Side - Actions */}
                                <div style={{ minWidth: '180px', textAlign: 'right' }}>
                                    <div style={{
                                        display: 'inline-block',
                                        background: match.matchScore > 80 ? '#28a745' : match.matchScore > 50 ? '#ffc107' : '#6c757d',
                                        color: match.matchScore > 50 ? 'white' : 'white',
                                        padding: '5px 12px',
                                        borderRadius: '15px',
                                        fontWeight: 'bold',
                                        fontSize: '13px',
                                        marginBottom: '12px'
                                    }}>
                                        {match.matchScore}% Match
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => viewProfile(match)}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            👤 Profile
                                        </button>
                                        
                                        <button
                                            onClick={() => openRequestModal(match)}
                                            disabled={pendingRequests[match._id] || !match.teachSkillsMatched || match.teachSkillsMatched.length === 0}
                                            style={{
                                                padding: '8px 16px',
                                                background: pendingRequests[match._id] ? '#28a745' : 
                                                           (match.teachSkillsMatched && match.teachSkillsMatched.length > 0 ? '#007bff' : '#ccc'),
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: (pendingRequests[match._id] || !match.teachSkillsMatched || match.teachSkillsMatched.length === 0) ? 'default' : 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                opacity: pendingRequests[match._id] ? 0.8 : 1
                                            }}
                                        >
                                            {pendingRequests[match._id] ? '✓ Sent' : '🤝 Request'}
                                        </button>
                                    </div>
                                    
                                    {match.teachSkillsMatched && match.teachSkillsMatched.length > 0 && !pendingRequests[match._id] && (
                                        <div style={{
                                            marginTop: '10px',
                                            fontSize: '11px',
                                            color: '#856404',
                                            background: '#fff3cd',
                                            padding: '6px',
                                            borderRadius: '5px'
                                        }}>
                                            💰 {match.teachSkillsMatched.length * 10} credits
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Request Modal */}
            {showRequestModal && selectedUser && (
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
                        borderRadius: '12px',
                        padding: '25px',
                        width: '450px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ marginBottom: '20px' }}>Send Request to {selectedUser.name}</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Skills to Learn:</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {requestSkills.map((skill, i) => (
                                    <span key={i} style={{
                                        background: '#28a745',
                                        color: 'white',
                                        padding: '4px 10px',
                                        borderRadius: '15px',
                                        fontSize: '12px'
                                    }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Message:</label>
                            <textarea
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                rows="3"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '20px', background: '#f0f7ff', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>💡 Summary:</div>
                            <div>• Skills: {requestSkills.length}</div>
                            <div>• Credits: {requestSkills.length * 10}</div>
                            <div>• Your balance: {user.skillCredits}</div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowRequestModal(false)}
                                style={{
                                    padding: '8px 20px',
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={sendRequest}
                                style={{
                                    padding: '8px 20px',
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Send Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillMatching;