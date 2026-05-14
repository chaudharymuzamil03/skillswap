import React, { useState, useEffect } from 'react';
import './Reviews.css';

const ReviewList = ({ userId, currentUser }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest'); // newest, highest, lowest

    useEffect(() => {
        fetchAllReviews();
    }, []);

    const fetchAllReviews = async () => {
        try {
            setLoading(true);
            setError('');
            
            console.log('🌍 Fetching ALL platform reviews...');
            const response = await fetch(`http://35.172.194.189:5000/api/reviews/all`);
            const data = await response.json();
            
            console.log('📦 All reviews response:', data);
            
            if (data.success) {
                setReviews(data.reviews || []);
            } else {
                setError(data.message || 'Failed to fetch reviews');
            }
        } catch (error) {
            console.error('❌ Fetch error:', error);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filteredReviews = reviews
        .filter(r => filter === 'all' ? true : r.rating === parseInt(filter))
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'highest') return b.rating - a.rating;
            if (sortBy === 'lowest') return a.rating - b.rating;
            return 0;
        });

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    };

    const renderStars = (rating) => {
        return (
            <div className="stars-display">
                {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={`star ${star <= rating ? 'filled' : ''}`}>
                        ★
                    </span>
                ))}
            </div>
        );
    };

    // Calculate global stats
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
        : '0.0';
    
    const ratingCounts = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
    };

    if (loading) {
        return (
            <div className="reviews-container">
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div className="loading-spinner" style={{ 
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #667eea',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }} />
                    <p style={{ color: '#718096' }}>Loading community reviews...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="reviews-container">
                <div style={{
                    background: '#f8d7da',
                    color: '#721c24',
                    padding: '30px',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                    <h3 style={{ margin: '0 0 10px 0' }}>Error Loading Reviews</h3>
                    <p style={{ margin: '0 0 20px 0' }}>{error}</p>
                    <button 
                        onClick={fetchAllReviews}
                        style={{
                            padding: '10px 24px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="reviews-container">
            <div className="reviews-header">
                <h2>🌍 Community Reviews</h2>
                <p style={{ color: '#718096', marginBottom: '20px' }}>
                    See what the SkillSwap community is saying!
                </p>
                
                {/* Global Stats */}
                {totalReviews > 0 && (
                    <div className="rating-summary" style={{ marginBottom: '30px' }}>
                        <div className="overall-rating">
                            <div className="rating-number">{avgRating}</div>
                            <div className="rating-stars">
                                {renderStars(Math.round(parseFloat(avgRating)))}
                            </div>
                            <div className="rating-count">
                                {totalReviews} total reviews
                            </div>
                        </div>

                        <div className="rating-distribution">
                            {[5, 4, 3, 2, 1].map(star => (
                                <div key={star} className="distribution-row">
                                    <span className="star-label">{star} ★</span>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ 
                                                width: `${totalReviews > 0 ? (ratingCounts[star] / totalReviews) * 100 : 0}%` 
                                            }}
                                        />
                                    </div>
                                    <span className="count">{ratingCounts[star]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters and Sort */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '25px',
                    flexWrap: 'wrap',
                    gap: '15px'
                }}>
                    <div className="reviews-filter" style={{ marginBottom: 0, borderBottom: 'none' }}>
                        <button 
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All ({totalReviews})
                        </button>
                        {[5, 4, 3, 2, 1].map(star => {
                            if (ratingCounts[star] === 0) return null;
                            return (
                                <button
                                    key={star}
                                    className={`filter-btn ${filter === star.toString() ? 'active' : ''}`}
                                    onClick={() => setFilter(star.toString())}
                                >
                                    {star} ★ ({ratingCounts[star]})
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: '#718096' }}>Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                background: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="newest">🆕 Newest First</option>
                            <option value="highest">⭐ Highest Rated</option>
                            <option value="lowest">⭐ Lowest Rated</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="reviews-list">
                {filteredReviews.length === 0 ? (
                    <div className="no-reviews">
                        <div className="no-reviews-icon">🌍</div>
                        <h3>No reviews yet</h3>
                        <p>Be the first to leave a review on SkillSwap!</p>
                        {currentUser && (
                            <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#667eea' }}>
                                Complete a skill swap and share your experience! ✨
                            </p>
                        )}
                    </div>
                ) : (
                    filteredReviews.map(review => (
                        <div key={review._id} className="review-card">
                            <div className="reviewer-info">
                                <div className="reviewer-avatar">
                                    {review.fromUser?.name?.split(' ').map(n => n[0]).join('') || '?'}
                                </div>
                                <div className="reviewer-details">
                                    <span className="reviewer-name">
                                        {review.fromUser?.name || 'Anonymous'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#718096' }}>
                                        reviewed
                                    </span>
                                    <span className="reviewer-name" style={{ fontSize: '0.95rem' }}>
                                        {review.toUser?.name || 'Anonymous'}
                                    </span>
                                    <span className="review-date">
                                        {formatDate(review.createdAt)}
                                    </span>
                                </div>
                                {review.fromUser?._id === currentUser?.id && (
                                    <span style={{
                                        marginLeft: '10px',
                                        fontSize: '0.7rem',
                                        padding: '2px 8px',
                                        background: '#e2e8f0',
                                        borderRadius: '12px',
                                        color: '#4a5568'
                                    }}>
                                        You
                                    </span>
                                )}
                            </div>

                            <div className="review-rating">
                                {renderStars(review.rating)}
                                <span style={{ 
                                    marginLeft: '10px', 
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: '#2d3748'
                                }}>
                                    {review.rating}.0
                                </span>
                            </div>

                            {review.comment && (
                                <p className="review-comment">"{review.comment}"</p>
                            )}

                            {review.tags && review.tags.length > 0 && (
                                <div className="review-tags">
                                    {review.tags.map(tag => {
                                        const tagIcon = {
                                            punctual: '⏰',
                                            knowledgeable: '📚',
                                            patient: '🧘',
                                            clear: '🎯',
                                            helpful: '🤝',
                                            friendly: '😊',
                                            organized: '📋',
                                            skilled: '💪'
                                        }[tag] || '🏷️';
                                        
                                        return (
                                            <span key={tag} className="review-tag">
                                                {tagIcon} {tag}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {review.sessionId && (
                                <div className="review-context">
                                    <span className="context-badge">
                                        📅 {typeof review.sessionId === 'object' 
                                            ? review.sessionId.skill || 'Skill session'
                                            : 'Skill session'}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewList;
