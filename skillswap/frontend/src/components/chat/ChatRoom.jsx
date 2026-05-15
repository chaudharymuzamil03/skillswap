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

    useEffect(() => {
        fetchMessages();
        fetchSessions();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [chat._id]);

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        // Id check ko handle kiya agar backend object ya string me se kuch bhi bheje
        const isOwnMessage = lastMessage?.senderId?._id === currentUser.id || lastMessage?.senderId === currentUser.id;
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

    const completeSession = async (sessionId) => {
        const session = sessions.find(s => s._id === sessionId);
        const isTeacher = session?.teacherId?._id === currentUser.id || session?.teacherId === currentUser.id;
        
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
                <button className="back-button" onClick={onBack}>←</button>
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
                <button className="schedule-button" onClick={() => setShowSchedule(true)}>
                    📅 Schedule Session
                </button>
            </div>

            {verificationMessage && (
                <div className="verification-message">{verificationMessage}</div>
            )}

            {sessions.filter(s => s.status === 'scheduled').length > 0 && (
                <div className="upcoming-sessions">
                    <div className="sessions-header">
                        <span>📅 Scheduled Sessions</span>
                        <span>{sessions.filter(s => s.status === 'scheduled').length}</span>
                    </div>
                    {sessions.filter(s => s.status === 'scheduled').map(session => {
                        const progress = getSkillProgress(session.skill);
                        const teacher = isTeacher(session);
                        const verified = hasUserVerified(session);
                        const sessionTime = new Date(session.scheduledTime);
                        const now = new Date();
                        const canComplete = sessionTime <= now;
                        
                        return (
                            <div key={session._id} className={`session-card ${session.status}`}>
                                <div className="session-info">
                                    <div className="session-skill">{session.skill}</div>
                                    <span className={`session-status ${session.status}`}>{session.status}</span>
                                    {progress && (
                                        <span className="session-progress">
                                            Session {session.sessionNumber || progress.completedSessions + 1}/{progress.totalSessions}
                                        </span>
                                    )}
                                    <span className="session-time">{new Date(session.scheduledTime).toLocaleString()}</span>
                                    <span className="session-duration">{session.duration} mins</span>
                                    
                                    {progress && progress.totalSessions > 1 && (
                                        <div className="progress-bar-container">
                                            <div className="progress-bar-fill" style={{ width: `${(progress.completedSessions / progress.totalSessions) * 100}%` }} />
                                            <span>{progress.completedSessions}/{progress.totalSessions} sessions</span>
                                        </div>
                                    )}
                                    
                                    {session.verifiedBy?.length > 0 && (
                                        <div className="verification-status">
                                            {verified ? '✓ You verified' : '⏳ Waiting for your verification'} ({session.verifiedBy.length}/2)
                                        </div>
                                    )}
                                </div>
                                <div className="session-actions">
                                    <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="join-button">Join</a>
                                    {!verified && (
                                        <button onClick={() => completeSession(session._id)} className="complete-button" disabled={!canComplete}>
                                            {teacher ? '✓ Complete' : '✓ Confirm'}
                                        </button>
                                    )}
                                    {verified && <span className="verified-badge">✓ Verified</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Messages Container */}
            <div className="messages-container" ref={messagesContainerRef}>
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
                            <div className="date-divider"><span>{date}</span></div>
                            {msgs.map((message, index) => {
                                // Id types comparison fix kiya taaki UI structure break na ho
                                const isOwn = message.senderId?._id === currentUser.id || message.senderId === currentUser.id;
                                const showAvatar = index === 0 || (msgs[index - 1].senderId?._id !== message.senderId?._id && msgs[index - 1].senderId !== message.senderId);
                                
                                return (
                                    <div key={message._id} className={`message ${isOwn ? 'own' : 'other'}`}>
                                        {!isOwn && showAvatar && (
                                            <div className="message-avatar">
                                                {message.senderId?.name?.split(' ').map(n => n[0]).join('') || '?'}
                                            </div>
                                        )}
                                        <div className="message-content-wrapper">
                                            {!isOwn && showAvatar && (
                                                <div className="message-sender">{message.senderId?.name || 'Unknown'}</div>
                                            )}
                                            <div className="message-content">
                                                <div className="message-text">{message.content}</div>
                                                <span className="message-time">{formatTime(message.createdAt)}</span>
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

            {/* Message Input */}
            <form className="message-input-form" onSubmit={sendMessage}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim()}>
                    Send
                </button>
            </form>

            {/* Completed Skills - Bottom Section */}
            {skillProgress.filter(p => p.status === 'completed').length > 0 && (
                <div className="completed-skills-section">
                    <div className="completed-skills-header">
                        <span>🏆 Completed Skills</span>
                        <span>{skillProgress.filter(p => p.status === 'completed').length}</span>
                    </div>
                    <div className="completed-skills-scroll">
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
                                s.skill === progress.skill && s.status === 'completed' &&
                                ((s.teacherId?._id === teacher.id && s.learnerId?._id === learner.id) ||
                                 (s.teacherId?._id === learner.id && s.learnerId?._id === teacher.id))
                            );

                            return (
                                <div key={progress._id} className="completed-skill-card">
                                    <div className="completed-skill-icon">{progress.skill.charAt(0).toUpperCase()}</div>
                                    <div className="completed-skill-info">
                                        <div className="completed-skill-name">{progress.skill}</div>
                                        <div className="completed-skill-user">
                                            👤 {targetUser.name.split(' ')[0]} · 🪙 {progress.totalSessions * 10}
                                        </div>
                                        {completedSession && completedSession.rating && (
                                            <div className="completed-skill-rating">
                                                ⭐ Rated {completedSession.rating}/5
                                            </div>
                                        )}
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
                                        className="rate-button"
                                    >
                                        ⭐ Rate
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