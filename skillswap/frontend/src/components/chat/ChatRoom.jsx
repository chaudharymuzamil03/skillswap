import React, { useState, useEffect, useRef } from 'react';
import ScheduleSession from './ScheduleSession';
import ReviewPopup from '../reviews/ReviewPopup';
import './Chat.css';

const ChatRoom = ({ chat, currentUser, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showSchedule, setShowSchedule] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [skillProgress, setSkillProgress] = useState([]);
    const [showReviewPopup, setShowReviewPopup] = useState(null);
    const [verificationMessage, setVerificationMessage] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const userScrolled = useRef(false);
    const messagesContainerRef = useRef(null);

    const otherUser = chat.participants?.find(p => p._id !== currentUser.id);

    // ============================================
    // Scroll Handling
    // ============================================
    const handleScroll = (e) => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
        userScrolled.current = !isAtBottom;
    };

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const scrollToBottom = () => {
        if (!userScrolled.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // ============================================
    // Fetch Messages and Sessions
    // ============================================
    useEffect(() => {
        fetchMessages();
        fetchSessions();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [chat._id]);

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        const isOwnMessage = lastMessage?.senderId?._id === currentUser.id;
        if (isOwnMessage) {
            scrollToBottom();
        } else if (!userScrolled.current) {
            scrollToBottom();
        }
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const response = await fetch(
                `http://32.198.132.159:5000/api/chats/${chat._id}/messages?userId=${currentUser.id}`
            );
            const data = await response.json();
            if (data.success) {
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessions = async () => {
        try {
            const response = await fetch(
                `http://32.198.132.159:5000/api/users/${currentUser.id}/sessions`
            );
            const data = await response.json();
            if (data.success) {
                const chatSessions = (data.sessions || []).filter(s => 
                    s.chatId?._id === chat._id || s.chatId === chat._id
                );
                setSessions(chatSessions);
                setSkillProgress(data.progress || []);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const response = await fetch(`http://32.198.132.159:5000/api/chats/${chat._id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: currentUser.id,
                    content: newMessage.trim()
                })
            });

            const data = await response.json();
            if (data.success) {
                setMessages([...messages, data.message]);
                setNewMessage('');
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // ============================================
    // Complete Session with Mutual Verification
    // ============================================
    const completeSession = async (sessionId) => {
        const session = sessions.find(s => s._id === sessionId);
        const isTeacher = session?.teacherId?._id === currentUser.id || session?.teacherId === currentUser.id;
        
        // Check if session date/time has passed
        const sessionTime = new Date(session.scheduledTime);
        const now = new Date();
        
        if (sessionTime > now) {
            alert(`⚠️ This session is scheduled for ${sessionTime.toLocaleString()}\n\nYou can only complete the session after the scheduled time has passed.`);
            return;
        }
        
        if (isTeacher) {
            if (!window.confirm('Mark this session as completed? The learner will need to confirm.')) {
                return;
            }
        } else {
            if (!window.confirm('Confirm that you attended this session? The teacher has marked it as completed.')) {
                return;
            }
        }
        
        try {
            const response = await fetch(`http://32.198.132.159:5000/api/sessions/${sessionId}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    role: isTeacher ? 'teacher' : 'learner'
                })
            });
            
            const data = await response.json();
            if (data.success) {
                if (data.waitingForOther) {
                    setVerificationMessage(data.message);
                    setTimeout(() => setVerificationMessage(''), 3000);
                } else if (data.isFinalSession) {
                    const progress = data.progress;
                    const isCurrentUserTeacher = progress.teacherId?._id === currentUser.id || progress.teacherId === currentUser.id;
                    
                    const teacher = {
                        id: progress.teacherId?._id || progress.teacherId,
                        name: progress.teacherId?.name || 'Teacher',
                        email: progress.teacherId?.email || ''
                    };
                    
                    const learner = {
                        id: progress.learnerId?._id || progress.learnerId,
                        name: progress.learnerId?.name || 'Learner',
                        email: progress.learnerId?.email || ''
                    };
                    
                    const targetUser = isCurrentUserTeacher ? learner : teacher;
                    
                    const completedSession = sessions.find(s => 
                        s.skill === progress.skill && 
                        s.status === 'completed' &&
                        (
                            (s.teacherId?._id === teacher.id && s.learnerId?._id === learner.id) ||
                            (s.teacherId?._id === learner.id && s.learnerId?._id === teacher.id)
                        )
                    );
                    
                    setShowReviewPopup({
                        targetUser,
                        sessionId: completedSession?._id || sessionId,
                        swapRequestId: progress.swapRequestId,
                        skill: progress.skill,
                        credits: data.creditAmount
                    });
                    
                    await fetchSessions();
                    await fetchMessages();
                    
                    alert(`🎉 SKILL COMPLETED! ${progress.skill} - ${data.creditAmount} credits transferred!`);
                } else {
                    alert(`✅ ${data.message}`);
                    fetchSessions();
                    fetchMessages();
                }
            } else {
                alert('❌ ' + data.message);
            }
        } catch (error) {
            console.error('Error completing session:', error);
            alert('❌ Failed to complete session');
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

    const groupMessagesByDate = () => {
        const groups = {};
        messages.forEach(message => {
            const date = formatDate(message.createdAt);
            if (!groups[date]) groups[date] = [];
            groups[date].push(message);
        });
        return groups;
    };

    const messageGroups = groupMessagesByDate();

    const isTeacher = (session) => {
        return session.teacherId?._id === currentUser.id || session.teacherId === currentUser.id;
    };

    const hasUserVerified = (session) => {
        return session.verifiedBy?.includes(currentUser.id) || 
               session.verifiedBy?.includes(currentUser.id.toString());
    };

    const getSkillProgress = (skillName) => {
        return skillProgress.find(p => p.skill === skillName && p.status === 'in-progress');
    };

    return (
        <div className="chat-room">
            <div className="chat-header">
                <button className="back-button" onClick={onBack}>
                    ←
                </button>
                <div className="chat-user-info">
                    <div className="chat-avatar large">
                        {otherUser?.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <div>
                        <h3>{otherUser?.name || 'Unknown User'}</h3>
                        {chat.swapRequestId && (
                            <div className="skill-badge">
                                {chat.swapRequestId.proposedSkills?.join(', ')}
                            </div>
                        )}
                    </div>
                </div>
                <button 
                    className="schedule-button"
                    onClick={() => setShowSchedule(true)}
                >
                    📅 Schedule Session
                </button>
            </div>

            {verificationMessage && (
                <div style={{
                    background: '#fff3cd',
                    color: '#856404',
                    padding: '10px 20px',
                    margin: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #ffeeba',
                    textAlign: 'center'
                }}>
                    {verificationMessage}
                </div>
            )}

            {/* ACTIVE SESSIONS - Scheduled */}
            {sessions.filter(s => s.status === 'scheduled').length > 0 && (
                <div className="upcoming-sessions">
                    <div className="sessions-header">
                        <span>📅 Scheduled Sessions</span>
                        <span style={{ fontSize: '0.8rem', color: '#718096' }}>
                            {sessions.filter(s => s.status === 'scheduled').length}
                        </span>
                    </div>
                    {sessions.filter(s => s.status === 'scheduled').map(session => {
                        const progress = getSkillProgress(session.skill);
                        const teacher = isTeacher(session);
                        const verified = hasUserVerified(session);
                        
                        // Check if session can be completed (time has passed)
                        const sessionTime = new Date(session.scheduledTime);
                        const now = new Date();
                        const canComplete = sessionTime <= now;
                        
                        return (
                            <div key={session._id} className={`session-card ${session.status}`}>
                                <div className="session-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <span className="session-skill">{session.skill}</span>
                                        <span className={`session-status ${session.status}`}>
                                            {session.status}
                                        </span>
                                        {progress && (
                                            <span style={{
                                                background: '#e7f3ff',
                                                color: '#0066cc',
                                                padding: '2px 10px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                Session {session.sessionNumber || progress.completedSessions + 1}/{progress.totalSessions}
                                            </span>
                                        )}
                                    </div>
                                    <span className="session-time">
                                        {new Date(session.scheduledTime).toLocaleString()}
                                    </span>
                                    <span className="session-duration">
                                        {session.duration} mins
                                    </span>
                                    
                                    {progress && progress.totalSessions > 1 && (
                                        <div style={{ marginTop: '8px', width: '100%' }}>
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                fontSize: '0.7rem',
                                                color: '#718096',
                                                marginBottom: '4px'
                                            }}>
                                                <span>Progress</span>
                                                <span>{progress.completedSessions}/{progress.totalSessions} sessions</span>
                                            </div>
                                            <div style={{
                                                width: '100%',
                                                height: '6px',
                                                background: '#edf2f7',
                                                borderRadius: '3px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${(progress.completedSessions / progress.totalSessions) * 100}%`,
                                                    height: '100%',
                                                    background: 'linear-gradient(90deg, #48bb78, #38a169)',
                                                    borderRadius: '3px',
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {session.verifiedBy?.length > 0 && (
                                        <div style={{ 
                                            marginTop: '5px', 
                                            fontSize: '0.7rem', 
                                            color: verified ? '#28a745' : '#856404'
                                        }}>
                                            {verified ? '✓ You verified' : '⏳ Waiting for your verification'} 
                                            ({session.verifiedBy.length}/2)
                                        </div>
                                    )}
                                </div>
                                
                                <div className="session-actions">
                                    <a 
                                        href={session.meetingLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="join-button"
                                    >
                                        Join
                                    </a>
                                    {!verified && (
                                        <button 
                                            onClick={() => completeSession(session._id)}
                                            className="complete-button"
                                            disabled={!canComplete}
                                            style={{
                                                background: teacher ? '#28a745' : '#17a2b8',
                                                opacity: canComplete ? 1 : 0.5,
                                                cursor: canComplete ? 'pointer' : 'not-allowed'
                                            }}
                                            title={!canComplete ? `Session time: ${new Date(session.scheduledTime).toLocaleString()}.\nComplete button will be available after this time.` : ''}
                                        >
                                            {teacher ? '✓ Complete' : '✓ Confirm'}
                                        </button>
                                    )}
                                    {verified && (
                                        <span style={{
                                            color: '#28a745',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            padding: '6px 12px',
                                            background: '#d4edda',
                                            borderRadius: '6px'
                                        }}>
                                            ✓ Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MESSAGES CONTAINER */}
            <div 
                className="messages-container" 
                ref={messagesContainerRef}
            >
                {loading ? (
                    <div className="loading-messages">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="no-messages">
                        <div className="no-messages-icon">💬</div>
                        <h4>No messages yet</h4>
                        <p>Send a message to start the conversation</p>
                    </div>
                ) : (
                    Object.entries(messageGroups).map(([date, msgs]) => (
                        <div key={date} className="message-group">
                            <div className="date-divider">
                                <span>{date}</span>
                            </div>
                            {msgs.map((message, index) => {
                                const isOwn = message.senderId?._id === currentUser.id;
                                const showAvatar = index === 0 || 
                                    msgs[index - 1].senderId?._id !== message.senderId?._id;
                                
                                return (
                                    <div
                                        key={message._id}
                                        className={`message ${isOwn ? 'own' : 'other'}`}
                                    >
                                        {!isOwn && showAvatar && (
                                            <div className="message-avatar">
                                                {message.senderId?.name?.split(' ').map(n => n[0]).join('') || '?'}
                                            </div>
                                        )}
                                        <div className="message-content-wrapper">
                                            {!isOwn && showAvatar && (
                                                <div className="message-sender">
                                                    {message.senderId?.name || 'Unknown'}
                                                </div>
                                            )}
                                            <div className="message-content">
                                                <div className="message-text">
                                                    {message.content}
                                                </div>
                                                <span className="message-time">
                                                    {formatTime(message.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="message-input-form" onSubmit={sendMessage}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    autoFocus
                />
                <button type="submit" disabled={!newMessage.trim()}>
                    Send
                </button>
            </form>

            {/* COMPLETED SKILLS */}
            {skillProgress.filter(p => p.status === 'completed').length > 0 && (
                <div style={{
                    margin: '16px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid #edf2f7',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, #faf089, #f6e05e)',
                        color: '#744210',
                        borderBottom: '1px solid #faf089'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🏆</span>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                                Completed Skills
                            </span>
                        </div>
                        <span style={{
                            background: 'rgba(116, 66, 16, 0.1)',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: '#744210'
                        }}>
                            {skillProgress.filter(p => p.status === 'completed').length}
                        </span>
                    </div>

                    <div style={{
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                        whiteSpace: 'nowrap',
                        background: '#fafafa'
                    }}>
                        {skillProgress.filter(p => p.status === 'completed').map(progress => {
                            const teacher = {
                                id: progress.teacherId?._id || progress.teacherId,
                                name: progress.teacherId?.name || 'Teacher',
                                email: progress.teacherId?.email || ''
                            };
                            
                            const learner = {
                                id: progress.learnerId?._id || progress.learnerId,
                                name: progress.learnerId?.name || 'Learner',
                                email: progress.learnerId?.email || ''
                            };
                            
                            const isCurrentUserTeacher = progress.teacherId?._id === currentUser.id || progress.teacherId === currentUser.id;
                            const targetUser = isCurrentUserTeacher ? learner : teacher;
                            
                            const completedSession = sessions.find(s => 
                                s.skill === progress.skill && 
                                s.status === 'completed' &&
                                (
                                    (s.teacherId?._id === teacher.id && s.learnerId?._id === learner.id) ||
                                    (s.teacherId?._id === learner.id && s.learnerId?._id === teacher.id)
                                )
                            );

                            return (
                                <div
                                    key={progress._id}
                                    style={{
                                        flex: '0 0 auto',
                                        width: '280px',
                                        background: 'white',
                                        borderRadius: '12px',
                                        padding: '14px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, #48bb78, #38a169)',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem'
                                        }}>
                                            {progress.skill.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ 
                                                fontWeight: '700', 
                                                fontSize: '0.95rem',
                                                color: '#2d3748',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {progress.skill}
                                            </div>
                                            <div style={{ 
                                                fontSize: '0.7rem', 
                                                color: '#718096',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <span>👤 {targetUser.name.split(' ')[0]}</span>
                                                <span>•</span>
                                                <span>🪙 {progress.totalSessions * 10}</span>
                                            </div>
                                        </div>
                                        <span style={{
                                            background: '#d4edda',
                                            color: '#155724',
                                            padding: '4px 8px',
                                            borderRadius: '20px',
                                            fontSize: '0.65rem',
                                            fontWeight: '700',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            ✓ Done
                                        </span>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            if (completedSession) {
                                                const response = await fetch(
                                                    `http://32.198.132.159:5000/api/users/${currentUser.id}/can-review/${targetUser.id}?sessionId=${completedSession._id}`
                                                );
                                                const data = await response.json();
                                                if (!data.canReview && data.reason === 'You have already reviewed this session') {
                                                    alert('✅ You have already reviewed this session');
                                                    return;
                                                }
                                            }
                                            
                                            setShowReviewPopup({
                                                targetUser,
                                                sessionId: completedSession?._id,
                                                swapRequestId: progress.swapRequestId,
                                                skill: progress.skill,
                                                credits: progress.totalSessions * 10
                                            });
                                        }}
                                        disabled={!completedSession}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            background: completedSession ? '#ffc107' : '#cbd5e0',
                                            color: completedSession ? '#000' : '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            cursor: completedSession ? 'pointer' : 'not-allowed',
                                            opacity: completedSession ? 1 : 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span>⭐</span> Rate {targetUser.name.split(' ')[0]}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {showSchedule && (
                <ScheduleSession
                    chat={chat}
                    currentUser={currentUser}
                    otherUser={otherUser}
                    onClose={() => setShowSchedule(false)}
                    onScheduled={() => {
                        setShowSchedule(false);
                        fetchSessions();
                        fetchMessages();
                    }}
                />
            )}

            {showReviewPopup && (
                <ReviewPopup
                    currentUser={currentUser}
                    targetUser={showReviewPopup.targetUser}
                    sessionId={showReviewPopup.sessionId}
                    swapRequestId={showReviewPopup.swapRequestId}
                    skill={showReviewPopup.skill}
                    credits={showReviewPopup.credits}
                    onClose={() => setShowReviewPopup(null)}
                    onSubmitted={() => {
                        setShowReviewPopup(null);
                        fetchSessions();
                        fetchMessages();
                        alert('✅ Review submitted successfully! Thank you for your feedback.');
                    }}
                />
            )}
        </div>
    );
};

export default ChatRoom;
