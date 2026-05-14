import React, { useState, useEffect } from 'react';

const SwapRequests = ({ user }) => {
    const [requests, setRequests] = useState({ sent: [], received: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('received');

    const fetchSwapRequests = async () => {
        try {
            setLoading(true);
            console.log('🔄 Fetching swap requests for user:', user.id);
            
            const response = await fetch(`http://localhost:5000/api/users/${user.id}/swap-requests`);
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
            const response = await fetch(`http://localhost:5000/api/swap-requests/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: action }),
            });

            const data = await response.json();
            
            if (data.success) {
                alert(data.message);
                fetchSwapRequests(); // Refresh requests
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
        <div className="module-card">
            <h2>Swap Requests</h2>
            
            <button 
                onClick={fetchSwapRequests}
                style={{ marginBottom: '20px', padding: '8px 16px' }}
            >
                🔄 Refresh Requests
            </button>
            
            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: '20px' }}>
                <div 
                    className={`tab ${activeTab === 'received' ? 'active' : ''}`}
                    onClick={() => setActiveTab('received')}
                >
                    Received ({requests.received.length})
                </div>
                <div 
                    className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sent')}
                >
                    Sent ({requests.sent.length})
                </div>
            </div>

            {/* Received Requests */}
            {activeTab === 'received' && (
                <div>
                    <h3>Incoming Requests</h3>
                    {requests.received.length === 0 ? (
                        <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                            No incoming swap requests yet.
                        </p>
                    ) : (
                        requests.received.map(request => (
                            <div key={request._id} className="match-card" style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h4>{request.fromUser?.name || 'Unknown User'}</h4>
                                        <p style={{ color: '#666', margin: '5px 0' }}>
                                            Wants to teach you: <strong>{request.proposedSkills?.join(', ') || 'No skills specified'}</strong>
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#999' }}>
                                            Sent: {new Date(request.createdAt).toLocaleDateString()}
                                        </p>
                                        <p style={{ 
                                            fontSize: '12px', 
                                            padding: '4px 8px', 
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
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                className="btn"
                                                style={{ background: '#28a745', width: 'auto', padding: '8px 12px' }}
                                                onClick={() => handleRequestAction(request._id, 'accepted')}
                                            >
                                                ✅ Accept
                                            </button>
                                            <button 
                                                className="btn"
                                                style={{ background: '#dc3545', width: 'auto', padding: '8px 12px' }}
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
                    <h3>Your Sent Requests</h3>
                    {requests.sent.length === 0 ? (
                        <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                            You haven't sent any swap requests yet.
                        </p>
                    ) : (
                        requests.sent.map(request => (
                            <div key={request._id} className="match-card" style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                                <div>
                                    <h4>To: {request.toUser?.name || 'Unknown User'}</h4>
                                    <p style={{ color: '#666', margin: '5px 0' }}>
                                        You want to learn: <strong>{request.proposedSkills?.join(', ') || 'No skills specified'}</strong>
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#999' }}>
                                        Sent: {new Date(request.createdAt).toLocaleDateString()}
                                    </p>
                                    <p style={{ 
                                        fontSize: '12px', 
                                        padding: '4px 8px', 
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