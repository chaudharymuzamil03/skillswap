import React, { useState, useEffect } from 'react';

const CreditSystem = ({ user }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        earned: 0,
        spent: 0,
        netChange: 0
    });

    const loadTransactions = async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching transactions for user:', user.id);
            
            const response = await fetch(`http://32.198.132.159:5000/api/users/${user.id}/transactions`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.transactions) {
                    setTransactions(data.transactions);
                    
                    let earned = 0;
                    let spent = 0;
                    
                    data.transactions.forEach(transaction => {
                        if (transaction.type === 'earned' || transaction.type === 'bonus') {
                            earned += transaction.amount;
                        } else if (transaction.type === 'spent') {
                            spent += Math.abs(transaction.amount);
                        }
                    });
                    
                    setStats({ earned, spent, netChange: earned - spent });
                    setError('');
                    console.log('✅ Loaded', data.transactions.length, 'transactions');
                    return;
                }
            }
            
            // Only show sample if no real data AND no error
            if (transactions.length === 0) {
                setTransactions([]);
                setStats({ earned: 0, spent: 0, netChange: 0 });
            }
            
        } catch (error) {
            console.error('❌ Error loading transactions:', error);
            setError('Connection error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.id) {
            loadTransactions();
        }
    }, [user]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Pending';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getTransactionColor = (type, amount) => {
        if (type === 'earned' || (amount && amount > 0)) return '#28a745';
        if (type === 'spent' || (amount && amount < 0)) return '#dc3545';
        if (type === 'bonus') return '#17a2b8';
        return '#666';
    };

    const getTransactionIcon = (type) => {
        switch(type) {
            case 'earned': return '💰';
            case 'bonus': return '🎁';
            case 'spent': return '📚';
            default: return '📝';
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <div>Loading credit data...</div>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Skill Credit System</h2>
            
            {error && (
                <div style={{
                    background: '#fff3cd',
                    color: '#856404',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #ffeaa7'
                }}>
                    ⚠️ {error}
                </div>
            )}
            
            {/* Credit Overview */}
            <div className="module-card" style={{ marginBottom: '30px' }}>
                <h3>Your Credit Balance</h3>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ 
                        fontSize: '3em', 
                        fontWeight: 'bold', 
                        color: user.skillCredits > 50 ? '#28a745' : user.skillCredits > 20 ? '#ffc107' : '#dc3545'
                    }}>
                        {user.skillCredits || 0}
                    </div>
                    <div style={{ color: '#666' }}>Available Skill Credits</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#28a745' }}>+{stats.earned}</div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>Credits Earned</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#dc3545' }}>-{stats.spent}</div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>Credits Spent</div>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="module-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>Transaction History</h3>
                    <button 
                        onClick={loadTransactions}
                        style={{
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        🔄 Refresh
                    </button>
                </div>
                
                <div style={{ marginTop: '15px' }}>
                    {transactions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
                            <div>No transactions yet</div>
                            <div style={{ fontSize: '12px', marginTop: '5px' }}>
                                Complete skill sessions to earn credits
                            </div>
                        </div>
                    ) : (
                        transactions.map(transaction => (
                            <div key={transaction._id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '15px',
                                borderBottom: '1px solid #eee'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '1.2em' }}>
                                            {getTransactionIcon(transaction.type)}
                                        </span>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{transaction.description}</div>
                                            <div style={{ color: '#666', fontSize: '0.9em' }}>
                                                {formatDate(transaction.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    fontWeight: 'bold',
                                    color: getTransactionColor(transaction.type, transaction.amount)
                                }}>
                                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreditSystem;
