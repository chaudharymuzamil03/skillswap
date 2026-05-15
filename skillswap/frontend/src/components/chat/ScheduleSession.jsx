import React, { useState, useEffect } from 'react';
import './Chat.css';

const ScheduleSession = ({ chat, currentUser, otherUser, onClose, onScheduled }) => {
    const [skill, setSkill] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [sessionNumber, setSessionNumber] = useState(1);
    const [totalSessions, setTotalSessions] = useState(1);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [existingProgress, setExistingProgress] = useState(null);
    const [availableTeachSkills, setAvailableTeachSkills] = useState([]);
    const [selectedRole, setSelectedRole] = useState('teacher');
    const [isLearningMode, setIsLearningMode] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // ============================================
    // Get skills based on who is teaching what
    // ============================================
    useEffect(() => {
        const myTeachSkills = currentUser.teachSkills || [];
        const otherTeachSkills = otherUser?.teachSkills || [];
        
        setAvailableTeachSkills({
            mine: myTeachSkills,
            theirs: otherTeachSkills
        });
        
    }, [currentUser, otherUser]);

    // ============================================
    // Fetch existing progress for a skill
    // ============================================
    useEffect(() => {
        if (skill && chat.swapRequestId?._id) {
            fetchExistingProgress();
        }
    }, [skill]);

    const fetchExistingProgress = async () => {
        try {
            setLoading(true);
            
            const isMeTeaching = selectedRole === 'teacher';
            const teacherId = isMeTeaching ? currentUser.id : otherUser._id;
            const learnerId = isMeTeaching ? otherUser._id : currentUser.id;
            
            const response = await fetch(
                `http://32.198.132.159:5000/api/skill-progress/check?` + 
                `swapRequestId=${chat.swapRequestId._id}&` +
                `skill=${skill}&` +
                `teacherId=${teacherId}&` +
                `learnerId=${learnerId}`
            );
            const data = await response.json();
            
            if (data.exists) {
                setExistingProgress(data);
                setTotalSessions(data.totalSessions);
                const nextSessionNumber = data.completedSessions + 1;
                setSessionNumber(nextSessionNumber);
            } else {
                setExistingProgress(null);
                setSessionNumber(1);
                setTotalSessions(1);
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = (role) => {
        setSelectedRole(role);
        setSkill('');
        setExistingProgress(null);
        setSessionNumber(1);
        setTotalSessions(1);
    };

    const handleSkillChange = (e) => {
        setSkill(e.target.value);
    };

    // ============================================
    // Get current date and time for min datetime
    // ============================================
    const getMinDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!skill || !date || !time) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }

        if (existingProgress && existingProgress.completedSessions >= existingProgress.totalSessions) {
            setError(`❌ Skill "${skill}" is already fully completed!`);
            setLoading(false);
            return;
        }

        if (sessionNumber > totalSessions) {
            setError(`❌ Cannot schedule session #${sessionNumber} when only ${totalSessions} sessions are needed`);
            setLoading(false);
            return;
        }

        try {
            const scheduledTime = new Date(`${date}T${time}`);
            const now = new Date();
            
            // Check if time is in the past
            if (scheduledTime < now) {
                setError('Scheduled time cannot be in the past. Please select current or future time.');
                setLoading(false);
                return;
            }

            const isMeTeaching = selectedRole === 'teacher';
            const teacherId = isMeTeaching ? currentUser.id : otherUser._id;
            const learnerId = isMeTeaching ? otherUser._id : currentUser.id;
            const teacherName = isMeTeaching ? currentUser.name : otherUser.name;
            const learnerName = isMeTeaching ? otherUser.name : currentUser.name;

            const response = await fetch('http://32.198.132.159:5000/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: chat._id,
                    teacherId,
                    learnerId,
                    skill,
                    scheduledTime,
                    duration,
                    sessionNumber,
                    totalSessions,
                    notes,
                    swapRequestId: chat.swapRequestId?._id
                })
            });

            const data = await response.json();
            
            if (data.success) {
                onScheduled();
            } else {
                setError(data.message || 'Failed to schedule session');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Check if user has any skills to teach
    const hasTeachSkills = (availableTeachSkills.mine?.length || 0) > 0;
    const hasLearnSkills = (availableTeachSkills.theirs?.length || 0) > 0;

    return (
        <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="modal-content schedule-modal" style={{
                margin: isMobile ? '16px' : 'auto',
                maxHeight: isMobile ? '90vh' : '85vh'
            }}>
                <div className="modal-header">
                    <h3>📅 Schedule a Skill Session</h3>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div style={{ padding: isMobile ? '15px 20px 0 20px' : '20px 25px 0 25px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea15, #764ba215)',
                        padding: isMobile ? '12px' : '15px',
                        borderRadius: '10px',
                        marginBottom: '20px'
                    }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: isMobile ? '14px' : '16px', color: '#4a5568' }}>🔄 Mutual Skill Swap</h4>
                        <p style={{ margin: '0', fontSize: isMobile ? '12px' : '0.9rem', color: '#4a5568' }}>
                            <strong>You can teach:</strong> {currentUser.teachSkills?.join(', ') || 'None added'}<br/>
                            <strong>{otherUser?.name} can teach:</strong> {otherUser?.teachSkills?.join(', ') || 'None added'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Role Selection - Who is teaching? */}
                    <div className="form-group" style={{ padding: isMobile ? '0 20px' : '0 25px' }}>
                        <label>Who is teaching this session? *</label>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '15px', marginTop: '5px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="teacher"
                                    checked={selectedRole === 'teacher'}
                                    onChange={() => handleRoleChange('teacher')}
                                    disabled={!hasTeachSkills}
                                />
                                <span style={{ fontWeight: selectedRole === 'teacher' ? '600' : 'normal', fontSize: isMobile ? '13px' : '14px' }}>
                                    👨‍🏫 Me ({currentUser.name}) teaching
                                </span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="learner"
                                    checked={selectedRole === 'learner'}
                                    onChange={() => handleRoleChange('learner')}
                                    disabled={!hasLearnSkills}
                                />
                                <span style={{ fontWeight: selectedRole === 'learner' ? '600' : 'normal', fontSize: isMobile ? '13px' : '14px' }}>
                                    👨‍🏫 {otherUser?.name} teaching
                                </span>
                            </label>
                        </div>
                        {selectedRole === 'teacher' && !hasTeachSkills && (
                            <small style={{ color: '#dc3545', display: 'block', marginTop: '5px', fontSize: isMobile ? '11px' : '12px' }}>
                                ⚠️ You haven't added any skills you can teach. Add skills in your profile.
                            </small>
                        )}
                        {selectedRole === 'learner' && !hasLearnSkills && (
                            <small style={{ color: '#dc3545', display: 'block', marginTop: '5px', fontSize: isMobile ? '11px' : '12px' }}>
                                ⚠️ {otherUser?.name} hasn't added any teaching skills yet.
                            </small>
                        )}
                    </div>

                    {/* Skill Selection - Based on who is teaching */}
                    <div className="form-group" style={{ padding: isMobile ? '0 20px' : '0 25px' }}>
                        <label style={{ fontSize: isMobile ? '13px' : '14px' }}>
                            {selectedRole === 'teacher' 
                                ? 'Skill You Will Teach *' 
                                : `Skill ${otherUser?.name} Will Teach *`}
                        </label>
                        <select 
                            value={skill} 
                            onChange={handleSkillChange}
                            required
                            disabled={!!existingProgress}
                            style={{ fontSize: isMobile ? '14px' : '15px' }}
                        >
                            <option value="">
                                {selectedRole === 'teacher'
                                    ? 'Select a skill you can teach'
                                    : `Select a skill ${otherUser?.name} can teach`}
                            </option>
                            {selectedRole === 'teacher' 
                                ? (availableTeachSkills.mine || []).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))
                                : (availableTeachSkills.theirs || []).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))
                            }
                        </select>
                        {existingProgress && (
                            <small style={{ color: '#28a745', display: 'block', marginTop: '5px', fontSize: isMobile ? '11px' : '12px' }}>
                                ✓ Skill already in progress
                            </small>
                        )}
                    </div>

                    {skill && (
                        <div className="form-group" style={{ padding: isMobile ? '0 20px' : '0 25px' }}>
                            <label style={{ fontSize: isMobile ? '13px' : '14px' }}>Session Progress</label>
                            <div style={{
                                background: existingProgress ? '#e7f3ff' : '#f8f9fa',
                                padding: isMobile ? '12px' : '15px',
                                borderRadius: '8px',
                                border: existingProgress ? '1px solid #28a745' : '1px solid #e0e0e0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                    <span style={{ fontWeight: '600', fontSize: isMobile ? '13px' : '14px' }}>
                                        {existingProgress 
                                            ? `📊 Session #${sessionNumber} of ${totalSessions}` 
                                            : `🆕 New Skill - Setup Required`}
                                    </span>
                                    {existingProgress && (
                                        <span style={{
                                            background: '#28a745',
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: isMobile ? '11px' : '0.8rem',
                                            fontWeight: '600'
                                        }}>
                                            {existingProgress.completedSessions}/{totalSessions} Completed
                                        </span>
                                    )}
                                </div>
                                
                                {existingProgress && existingProgress.totalSessions > 0 && (
                                    <>
                                        <div style={{
                                            width: '100%',
                                            height: '8px',
                                            background: '#edf2f7',
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{
                                                width: `${(existingProgress.completedSessions / totalSessions) * 100}%`,
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #48bb78, #38a169)',
                                                borderRadius: '4px',
                                                transition: 'width 0.3s'
                                            }} />
                                        </div>
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            fontSize: isMobile ? '11px' : '0.8rem',
                                            color: '#4a5568'
                                        }}>
                                            <span>✓ {existingProgress.completedSessions} completed</span>
                                            <span>⏳ {totalSessions - existingProgress.completedSessions} remaining</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="form-row" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                        gap: isMobile ? '12px' : '15px',
                        padding: isMobile ? '0 20px' : '0 25px'
                    }}>
                        <div className="form-group">
                            <label style={{ fontSize: isMobile ? '13px' : '14px' }}>Total Sessions Needed</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={totalSessions}
                                onChange={(e) => {
                                    const newTotal = parseInt(e.target.value) || 1;
                                    setTotalSessions(newTotal);
                                    if (!existingProgress) {
                                        setSessionNumber(1);
                                    }
                                }}
                                disabled={!!existingProgress}
                                style={{ fontSize: isMobile ? '14px' : '15px' }}
                            />
                            <small style={{ color: existingProgress ? '#28a745' : '#666', fontSize: isMobile ? '10px' : '11px', display: 'block', marginTop: '4px' }}>
                                {existingProgress 
                                    ? '✓ Locked - already in progress' 
                                    : 'How many sessions to complete this skill?'}
                            </small>
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: isMobile ? '13px' : '14px' }}>Current Session #</label>
                            <input
                                type="number"
                                min="1"
                                max={totalSessions}
                                value={sessionNumber}
                                onChange={(e) => {
                                    const newNum = parseInt(e.target.value) || 1;
                                    if (newNum <= totalSessions && newNum >= 1) {
                                        setSessionNumber(newNum);
                                    }
                                }}
                                disabled={!!existingProgress}
                                style={{ 
                                    fontSize: isMobile ? '14px' : '15px',
                                    background: existingProgress ? '#f8f9fa' : 'white',
                                    cursor: existingProgress ? 'not-allowed' : 'text'
                                }}
                            />
                            <small style={{ color: existingProgress ? '#28a745' : '#666', fontSize: isMobile ? '10px' : '11px', display: 'block', marginTop: '4px' }}>
                                {existingProgress 
                                    ? `✓ Next session is #${sessionNumber}` 
                                    : 'Which session number is this?'}
                            </small>
                        </div>
                    </div>

                    <div className="form-row" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                        gap: isMobile ? '12px' : '15px',
                        padding: isMobile ? '0 20px' : '0 25px'
                    }}>
                        <div className="form-group">
                            <label style={{ fontSize: isMobile ? '13px' : '14px' }}>Date *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                                style={{ fontSize: isMobile ? '14px' : '15px' }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: isMobile ? '13px' : '14px' }}>Time *</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                                style={{ fontSize: isMobile ? '14px' : '15px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ padding: isMobile ? '0 20px' : '0 25px' }}>
                        <label style={{ fontSize: isMobile ? '13px' : '14px' }}>Duration</label>
                        <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ fontSize: isMobile ? '14px' : '15px' }}>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={90}>1.5 hours</option>
                            <option value={120}>2 hours</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ padding: isMobile ? '0 20px' : '0 25px' }}>
                        <label style={{ fontSize: isMobile ? '13px' : '14px' }}>Notes (Optional)</label>
                        <textarea
                            placeholder="Add any notes or agenda for this session..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="3"
                            style={{ fontSize: isMobile ? '14px' : '15px' }}
                        />
                    </div>

                    {error && (
                        <div className="error-message" style={{ 
                            margin: isMobile ? '0 20px 15px 20px' : '0 25px 20px 25px',
                            fontSize: isMobile ? '12px' : '13px'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="modal-actions" style={{ 
                        display: 'flex', 
                        gap: isMobile ? '10px' : '12px', 
                        justifyContent: 'flex-end',
                        padding: isMobile ? '0 20px 20px 20px' : '0 25px 25px 25px',
                        flexDirection: isMobile ? 'column' : 'row'
                    }}>
                        <button 
                            type="button" 
                            className="cancel-button" 
                            onClick={onClose}
                            disabled={loading}
                            style={{ 
                                width: isMobile ? '100%' : 'auto',
                                padding: isMobile ? '12px' : '10px 20px',
                                fontSize: isMobile ? '14px' : '14px'
                            }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="schedule-submit-button"
                            disabled={loading || !skill || !date || !time || sessionNumber > totalSessions}
                            style={{ 
                                width: isMobile ? '100%' : 'auto',
                                padding: isMobile ? '12px' : '10px 20px',
                                fontSize: isMobile ? '14px' : '14px'
                            }}
                        >
                            {loading ? 'Scheduling...' : `📅 Schedule Session #${sessionNumber}`}
                        </button>
                    </div>
                </form>

                <div className="schedule-info" style={{ 
                    padding: isMobile ? '12px 20px' : '12px 25px',
                    fontSize: isMobile ? '10px' : '11px'
                }}>
                    <small>
                        <strong>🔄 Mutual Swap:</strong><br/>
                        • 👨‍🏫 You teach: {currentUser.teachSkills?.join(', ') || 'None'}<br/>
                        • 👨‍🏫 {otherUser?.name} teaches: {otherUser?.teachSkills?.join(', ') || 'None'}<br/>
                        • Select who is teaching to schedule the appropriate skill<br/>
                        • Credits transfer after FINAL session of each skill<br/>
                        • <strong>📅 You can schedule from today's current time onward</strong>
                    </small>
                </div>
            </div>
        </div>
    );
};

export default ScheduleSession;