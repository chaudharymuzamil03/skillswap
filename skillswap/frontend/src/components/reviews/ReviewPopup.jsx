import React, { useState, useEffect } from 'react';
import './Reviews.css';

const ReviewPopup = ({ 
    currentUser, 
    targetUser, 
    sessionId, 
    swapRequestId, 
    skill, 
    credits, 
    onClose, 
    onSubmitted 
}) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [canReview, setCanReview] = useState(true);
    const [checking, setChecking] = useState(true);

    const tags = [
        { id: 'punctual', label: '⏰ Punctual' },
        { id: 'knowledgeable', label: '📚 Knowledgeable' },
        { id: 'patient', label: '🧘 Patient' },
        { id: 'clear', label: '🎯 Clear' },
        { id: 'helpful', label: '🤝 Helpful' },
        { id: 'friendly', label: '😊 Friendly' },
        { id: 'organized', label: '📋 Organized' },
        { id: 'skilled', label: '💪 Skilled' }
    ];

    useEffect(() => {
        const checkCanReview = async () => {
            if (!sessionId) {
                setCanReview(true);
                setChecking(false);
                return;
            }

            try {
                const response = await fetch(
                    `http://localhost:5000/api/users/${currentUser.id}/can-review/${targetUser.id}?sessionId=${sessionId}`
                );
                const data = await response.json();
                
                if (data.success) {
                    setCanReview(data.canReview);
                    if (!data.canReview) {
                        setError(data.reason || 'You cannot review this session');
                    }
                }
            } catch (error) {
                console.error('Error checking review eligibility:', error);
            } finally {
                setChecking(false);
            }
        };

        checkCanReview();
    }, [sessionId, currentUser.id, targetUser.id]);

    const handleTagToggle = (tagId) => {
        setSelectedTags(prev => 
            prev.includes(tagId) 
                ? prev.filter(t => t !== tagId) 
                : [...prev, tagId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (rating === 0) {
            setError('Please select a rating');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromUser: currentUser.id,
                    toUser: targetUser.id,
                    sessionId,
                    swapRequestId,
                    rating,
                    comment: comment.trim(),
                    tags: selectedTags
                })
            });

            const data = await response.json();
            
            if (data.success) {
                onSubmitted(data.review);
            } else {
                setError(data.message || 'Failed to submit review');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" style={{ maxWidth: '400px', padding: '30px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '15px' }}>⏳</div>
                    <p>Checking review eligibility...</p>
                </div>
            </div>
        );
    }

    if (!canReview) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" style={{ maxWidth: '400px', padding: '30px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>⛔</div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Cannot Submit Review</h3>
                    <p style={{ color: '#666', marginBottom: '25px' }}>{error || 'You have already reviewed this session'}</p>
                    <button 
                        onClick={onClose}
                        style={{
                            padding: '10px 30px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className="modal-content" 
                style={{ 
                    maxWidth: '500px', 
                    padding: 0, 
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }} 
                onClick={e => e.stopPropagation()}
            >
                {/* Celebration Header - More Compact */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    padding: '24px',
                    color: 'white',
                    textAlign: 'center',
                    position: 'relative'
                }}>
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            fontSize: '20px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                    >
                        ×
                    </button>
                    
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '700' }}>
                        Skill Completed!
                    </h2>
                    <p style={{ margin: 0, opacity: 0.95, fontSize: '15px' }}>
                        You've mastered <strong style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px' }}>{skill}</strong>
                    </p>
                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        padding: '6px 16px',
                        borderRadius: '30px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '12px',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        <span>🪙</span>
                        {credits} Credits Transferred
                    </div>
                </div>

                {/* Review Form - Scrollable */}
                <div style={{ 
                    padding: '20px', 
                    maxHeight: '60vh', 
                    overflowY: 'auto',
                    background: '#fff'
                }}>
                    {/* User Info - Compact */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        marginBottom: '20px',
                        padding: '12px',
                        background: '#f8fafc',
                        borderRadius: '12px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ffc107, #ffb300)',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            boxShadow: '0 2px 8px rgba(255,193,7,0.3)'
                        }}>
                            {targetUser.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '2px' }}>
                                You're reviewing
                            </div>
                            <div style={{ 
                                fontWeight: '700', 
                                fontSize: '1rem',
                                color: '#2d3748'
                            }}>
                                {targetUser.name}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Star Rating - Compact */}
                        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                            <div style={{ 
                                marginBottom: '8px', 
                                fontWeight: '600', 
                                color: '#2d3748',
                                fontSize: '0.9rem'
                            }}>
                                How was your experience?
                            </div>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '32px',
                                            cursor: 'pointer',
                                            color: (hoverRating || rating) >= star ? '#ffc107' : '#e2e8f0',
                                            transition: 'all 0.2s',
                                            padding: '0 2px',
                                            transform: (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)',
                                            outline: 'none'
                                        }}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <div style={{ 
                                marginTop: '6px', 
                                fontSize: '0.85rem', 
                                color: '#4a5568',
                                fontWeight: '500',
                                minHeight: '20px'
                            }}>
                                {rating === 1 && '😞 Poor'}
                                {rating === 2 && '😐 Fair'}
                                {rating === 3 && '🙂 Good'}
                                {rating === 4 && '😊 Very Good'}
                                {rating === 5 && '🌟 Excellent'}
                            </div>
                        </div>

                        {/* Quick Tags - 2 columns */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ 
                                marginBottom: '10px', 
                                fontSize: '0.85rem', 
                                fontWeight: '600', 
                                color: '#2d3748' 
                            }}>
                                What went well? (Optional)
                            </div>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '8px'
                            }}>
                                {tags.map(tag => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => handleTagToggle(tag.id)}
                                        style={{
                                            padding: '8px 12px',
                                            background: selectedTags.includes(tag.id) ? '#667eea' : '#edf2f7',
                                            color: selectedTags.includes(tag.id) ? 'white' : '#4a5568',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'left',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment - Compact */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ 
                                marginBottom: '8px', 
                                fontSize: '0.85rem', 
                                fontWeight: '600', 
                                color: '#2d3748' 
                            }}>
                                Write a review (Optional)
                            </div>
                            <textarea
                                placeholder="Share your experience..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows="2"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    resize: 'none',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    fontFamily: 'inherit'
                                }}
                                maxLength="200"
                            />
                            <div style={{ 
                                textAlign: 'right', 
                                fontSize: '0.7rem', 
                                color: '#a0aec0', 
                                marginTop: '4px' 
                            }}>
                                {comment.length}/200
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                background: '#fed7d7',
                                color: '#c53030',
                                padding: '10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        {/* Action Buttons - Always visible at bottom */}
                        <div style={{ 
                            display: 'flex', 
                            gap: '10px',
                            marginTop: '10px'
                        }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'white',
                                    color: '#718096',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Skip
                            </button>
                            <button
                                type="submit"
                                disabled={loading || rating === 0}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: rating === 0 ? '#cbd5e0' : 'linear-gradient(135deg, #ffc107, #ffb300)',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem',
                                    fontWeight: '700',
                                    cursor: rating === 0 ? 'not-allowed' : 'pointer',
                                    opacity: rating === 0 ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                {loading ? 'Submitting...' : '⭐ Submit Review'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReviewPopup;