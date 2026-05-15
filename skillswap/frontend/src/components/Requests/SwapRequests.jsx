import React, { useState, useEffect } from 'react';

const SwapRequests = ({ user }) => {
    const [requests, setRequests] = useState({ sent: [], received: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('received');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchSwapRequests = async () => {
        try {
            setLoading(true);
            console.log('🔄 Fetching swap requests for user:', user.id);
            
            const response = await fetch(`http://32.198.132.159:5000/api/users/${user.id}/swap-requests`);
            const data = await response.json();
            
            console.log('📨 API Response:', data);
            
            if (data.success) {
                setRequests({
                    sent: data.sentRequests || [],
                    received: data.receivedRequests || []
                });
                console.log('✅ Requests loaded - Sent:', data.sentRequests?.length, 'Received:', data.receivedRequests?.length);
            } else {
                console.error('❌ Failed to load requests:', data.message);
            }
        } catch (error) {
            console.error('❌ Error fetching swap requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAction = async (requestId, action) => {
        try {
            const response = await fetch(`http://32.198.132.159:5000/api/swap-requests/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: action }),
            });

            const data = await response.json();
            
            if (data.success) {
                alert(data.message);
                fetchSwapRequests();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error updating request:', error);
            alert('Error processing request');
        }
    };

    useEffect(() => {
        if (user && user.id) {
            fetchSwapRequests();
        }
    }, [user]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <div>🔄 Loading swap requests...</div>
            </div>
        );
    }

    return (
        <div className="module-card" style={{ padding: isMobile ? '12px' : '20px' }}>
            <h2 style={{ fontSize: isMobile ? '1.3rem' : '1.5rem', marginBottom: '15px' }}>Swap Requests</h2>
            
            <button 
                onClick={fetchSwapRequests}
                style={{ 
                    marginBottom: '15px', 
                    padding: isMobile ? '8px 12px' : '8px 16px',
                    width: isMobile ? '100%' : 'auto',
                    fontSize: isMobile ? '12px' : '14px'
                }}
            >
                🔄 Refresh Requests
            </button>
            
            {/* Tabs */}
            <div className="tabs" style={{ 
                marginBottom: '15px', 
                display: 'flex', 
                gap: '10px',
                flexDirection: isMobile ? 'column' : 'row'
            }}>
                <div 
                    className={`tab ${activeTab === 'received' ? 'active' : ''}`}
                    onClick={() => setActiveTab('received')}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: isMobile ? '10px' : '12px',
                        background: activeTab === 'received' ? '#007bff' : '#f0f0f0',
                        color: activeTab === 'received' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '13px' : '14px'
                    }}
                >
                    Received ({requests.received.length})
                </div>
                <div 
                    className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sent')}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: isMobile ? '10px' : '12px',
                        background: activeTab === 'sent' ? '#007bff' : '#f0f0f0',
                        color: activeTab === 'sent' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '13px' : '14px'
                    }}
                >
                    Sent ({requests.sent.length})
                </div>
            </div>

            {/* Received Requests */}
            {activeTab === 'received' && (
                <div>
                    <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', marginBottom: '10px' }}>Incoming Requests</h3>
                    {requests.received.length === 0 ? (
                        <p style={{ color: '#666', textAlign: 'center', padding: '20px', fontSize: isMobile ? '13px' : '14px' }}>
                            No incoming swap requests yet.
                        </p>
                    ) : (
                        requests.received.map(request => (
                            <div key={request._id} className="match-card" style={{ 
                                marginBottom: '15px', 
                                padding: isMobile ? '12px' : '15px', 
                                border: '1px solid #ddd', 
                                borderRadius: '8px',
                                background: 'white'
                            }}>
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between', 
                                    alignItems: isMobile ? 'stretch' : 'start',
                                    gap: isMobile ? '12px' : '0'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: '5px' }}>{request.fromUser?.name || 'Unknown User'}</h4>
                                        <p style={{ color: '#666', margin: '5px 0', fontSize: isMobile ? '12px' : '14px' }}>
                                            Wants to teach you: <strong>{request.proposedSkills?.join(', ') || 'No skills specified'}</strong>
                                        </p>
                                        <p style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
                                            Sent: {new Date(request.createdAt).toLocaleDateString()}
                                        </p>
                                        <p style={{ 
                                            fontSize: '11px', 
                                            padding: '4px 10px', 
                                            borderRadius: '12px',
                                            background: request.status === 'pending' ? '#fff3cd' : 
                                                       request.status === 'accepted' ? '#d4edda' : '#f8d7da',
                                            color: request.status === 'pending' ? '#856404' : 
                                                  request.status === 'accepted' ? '#155724' : '#721c24',
                                            display: 'inline-block'
                                        }}>
                                            {request.status?.toUpperCase() || 'PENDING'}
                                        </p>
                                    </div>
                                    
                                    {request.status === 'pending' && (
                                        <div style={{ 
                                            display: 'flex', 
                                            gap: '10px',
                                            flexDirection: isMobile ? 'row' : 'column',
                                            justifyContent: isMobile ? 'space-between' : 'flex-start'
                                        }}>
                                            <button 
                                                className="btn"
                                                style={{ 
                                                    background: '#28a745', 
                                                    width: isMobile ? '48%' : 'auto', 
                                                    padding: isMobile ? '10px 12px' : '8px 12px',
                                                    fontSize: isMobile ? '13px' : '14px'
                                                }}
                                                onClick={() => handleRequestAction(request._id, 'accepted')}
                                            >
                                                ✅ Accept
                                            </button>
                                            <button 
                                                className="btn"
                                                style={{ 
                                                    background: '#dc3545', 
                                                    width: isMobile ? '48%' : 'auto', 
                                                    padding: isMobile ? '10px 12px' : '8px 12px',
                                                    fontSize: isMobile ? '13px' : '14px'
                                                }}
                                                onClick={() => handleRequestAction(request._id, 'rejected')}
                                            >
                                                ❌ Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Sent Requests */}
            {activeTab === 'sent' && (
                <div>
                    <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', marginBottom: '10px' }}>Your Sent Requests</h3>
                    {requests.sent.length === 0 ? (
                        <p style={{ color: '#666', textAlign: 'center', padding: '20px', fontSize: isMobile ? '13px' : '14px' }}>
                            You haven't sent any swap requests yet.
                        </p>
                    ) : (
                        requests.sent.map(request => (
                            <div key={request._id} className="match-card" style={{ 
                                marginBottom: '15px', 
                                padding: isMobile ? '12px' : '15px', 
                                border: '1px solid #ddd', 
                                borderRadius: '8px',
                                background: 'white'
                            }}>
                                <div>
                                    <h4 style={{ fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: '5px' }}>To: {request.toUser?.name || 'Unknown User'}</h4>
                                    <p style={{ color: '#666', margin: '5px 0', fontSize: isMobile ? '12px' : '14px' }}>
                                        You want to learn: <strong>{request.proposedSkills?.join(', ') || 'No skills specified'}</strong>
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
                                        Sent: {new Date(request.createdAt).toLocaleDateString()}
                                    </p>
                                    <p style={{ 
                                        fontSize: '11px', 
                                        padding: '4px 10px', 
                                        borderRadius: '12px',
                                        background: request.status === 'pending' ? '#fff3cd' : 
                                                   request.status === 'accepted' ? '#d4edda' : '#f8d7da',
                                        color: request.status === 'pending' ? '#856404' : 
                                              request.status === 'accepted' ? '#155724' : '#721c24',
                                        display: 'inline-block'
                                    }}>
                                        Status: {request.status?.toUpperCase() || 'PENDING'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SwapRequests;