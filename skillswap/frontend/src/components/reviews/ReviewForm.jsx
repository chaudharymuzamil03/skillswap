import React, { useState, useEffect } from 'react';
import './Reviews.css';

const ReviewForm = ({ 
    currentUser, 
    targetUser, 
    sessionId, 
    swapRequestId, 
    onSubmitted, 
    onCancel 
}) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [canReview, setCanReview] = useState(false);
    const [reason, setReason] = useState('');

    const tags = [
        { id: 'punctual', label: '⏰ Punctual', icon: '⏰' },
        { id: 'knowledgeable', label: '📚 Knowledgeable', icon: '📚' },
        { id: 'patient', label: '🧘 Patient', icon: '🧘' },
        { id: 'clear', label: '🎯 Clear Explanations', icon: '🎯' },
        { id: 'helpful', label: '🤝 Helpful', icon: '🤝' },
        { id: 'friendly', label: '😊 Friendly', icon: '😊' },
        { id: 'organized', label: '📋 Organized', icon: '📋' },
        { id: 'skilled', label: '💪 Highly Skilled', icon: '💪' }
    ];

    useEffect(() => {
    console.log('🎯 ReviewForm - Target User:', targetUser);
    console.log('🎯 ReviewForm - Current User:', currentUser);
    console.log('🎯 ReviewForm - Session ID:', sessionId);
    checkCanReview();
}, [targetUser, currentUser, sessionId]);

    const checkCanReview = async () => {
        try {
            let url = `http://localhost:5000/api/users/${currentUser.id}/can-review/${targetUser.id}`;
            if (sessionId) url += `?sessionId=${sessionId}`;
            if (swapRequestId) url += `?swapRequestId=${swapRequestId}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                setCanReview(data.canReview);
                setReason(data.reason);
            }
        } catch (error) {
            console.error('Error checking review eligibility:', error);
        }
    };

    const handleTagToggle = (tagId) => {
        setSelectedTags(prev => {
            if (prev.includes(tagId)) {
                return prev.filter(t => t !== tagId);
            } else {
                return [...prev, tagId];
            }
        });
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
                    comment,
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

    if (!canReview) {
        return (
            <div className="review-form-container">
                <div className="cannot-review">
                    <div className="cannot-review-icon">⛔</div>
                    <h3>Cannot Submit Review</h3>
                    <p>{reason || 'You are not eligible to review this user yet'}</p>
                    <button className="cancel-button" onClick={onCancel}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="review-form-container">
            <div className="review-form">
                <div className="review-header">
                    <h3>Review {targetUser?.name}</h3>
                    <button className="close-button" onClick={onCancel}>×</button>
                </div>

                <div className="user-badge">
                    <div className="user-avatar">
                        {targetUser?.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{targetUser?.name}</span>
                        <span className="user-email">{targetUser?.email}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="rating-section">
                        <label>Your Rating *</label>
                        <div className="star-rating-container">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`star-button ${(hoverRating || rating) >= star ? 'active' : ''}`}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <div className="rating-label">
                            {rating === 1 && 'Poor'}
                            {rating === 2 && 'Fair'}
                            {rating === 3 && 'Good'}
                            {rating === 4 && 'Very Good'}
                            {rating === 5 && 'Excellent'}
                        </div>
                    </div>

                    <div className="tags-section">
                        <label>What went well? (Select all that apply)</label>
                        <div className="tags-grid">
                            {tags.map(tag => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    className={`tag-button ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                                    onClick={() => handleTagToggle(tag.id)}
                                >
                                    <span className="tag-icon">{tag.icon}</span>
                                    {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="comment-section">
                        <label>Write your review</label>
                        <textarea
                            placeholder="Share your experience... What did you learn? How was the session?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows="4"
                            maxLength="500"
                        />
                        <div className="char-count">
                            {comment.length}/500
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="review-actions">
                        <button 
                            type="button" 
                            className="cancel-button" 
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="submit-review-button"
                            disabled={loading || rating === 0}
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>

                <div className="review-info">
                    <small>
                        Your review helps others know about {targetUser?.name}'s teaching style.
                        Reviews are public and cannot be edited once submitted.
                    </small>
                </div>
            </div>
        </div>
    );
};

export default ReviewForm;