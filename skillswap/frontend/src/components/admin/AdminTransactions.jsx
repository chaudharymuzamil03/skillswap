// AdminTransactions.jsx - Professional Version
import React, { useState, useEffect } from 'react';

const AdminTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        totalCredits: 0,
        totalEarned: 0,
        totalSpent: 0,
        totalTransactions: 0
    });
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        fetchAllTransactions();
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    };

    const fetchAllTransactions = async () => {
        try {
            const response = await fetch('http://32.198.132.159:5000/api/admin/transactions/all');
            const data = await response.json();
            if (data.success) {
                setTransactions(data.transactions);
                setStats(data.stats);
            } else {
                showNotification(data.message || 'Failed to fetch transactions', 'error');
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            showNotification('Failed to fetch transactions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesFilter = filter === 'all' || t.type === filter;
        const matchesSearch = searchTerm === '' ||
            (t.userName && t.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.relatedUserName && t.relatedUserName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Loading transactions...</div>;
    }

    return (
        <div>
            {/* Notification */}
            {notification.show && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '12px 20px',
                    background: notification.type === 'success' ? '#28a745' : '#dc3545',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '14px',
                    zIndex: 9999,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                    {notification.message}
                </div>
            )}

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>💰</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#0066cc' }}>{stats.totalTransactions || 0}</div>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>Total Transactions</div>
                </div>
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>💎</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#28a745' }}>{stats.totalCredits || 0}</div>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>Total Credits</div>
                </div>
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>⬆️</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffc107' }}>{stats.totalEarned || 0}</div>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>Credits Earned</div>
                </div>
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>⬇️</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc3545' }}>{stats.totalSpent || 0}</div>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>Credits Spent</div>
                </div>
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '20px',
                flexWrap: 'wrap'
            }}>
                <input
                    type="text"
                    placeholder="Search by user or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '10px 15px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        minWidth: '250px'
                    }}
                />
                
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{
                        padding: '10px 15px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        background: 'white',
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Transactions</option>
                    <option value="earned">Earned</option>
                    <option value="spent">Spent</option>
                    <option value="bonus">Bonus</option>
                    <option value="transfer">Transfer</option>
                </select>
            </div>

            {/* Transactions Table */}
            <div style={{
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                overflow: 'auto'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Date</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>User</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Type</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Description</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#495057' }}>Related User</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map((t, index) => (
                            <tr key={t._id || index} style={{ borderBottom: index === filteredTransactions.length - 1 ? 'none' : '1px solid #e9ecef' }}>
                                <td style={{ padding: '12px', fontSize: '13px', color: '#6c757d' }}>{formatDate(t.createdAt)}</td>
                                <td style={{ padding: '12px', fontWeight: '500', fontSize: '14px' }}>{t.userName || 'Unknown'}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '3px 10px',
                                        borderRadius: '15px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        background: t.type === 'earned' ? '#d4edda' : 
                                                   t.type === 'spent' ? '#f8d7da' : 
                                                   t.type === 'bonus' ? '#fff3cd' : '#e2e3e5',
                                        color: t.type === 'earned' ? '#155724' : 
                                               t.type === 'spent' ? '#721c24' : 
                                               t.type === 'bonus' ? '#856404' : '#383d41'
                                    }}>
                                        {t.type || 'transfer'}
                                    </span>
                                </td>
                                <td style={{ 
                                    padding: '12px', 
                                    textAlign: 'right',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    color: (t.amount > 0 || t.type === 'earned') ? '#28a745' : '#dc3545'
                                }}>
                                    {(t.amount > 0 || t.type === 'earned') ? '+' : ''}{t.amount || 0}
                                </td>
                                <td style={{ padding: '12px', fontSize: '13px', color: '#495057' }}>{t.description || '-'}</td>
                                <td style={{ padding: '12px', fontSize: '13px', color: '#6c757d' }}>{t.relatedUserName || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredTransactions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                    <p style={{ color: '#6c757d' }}>No transactions found</p>
                </div>
            )}
        </div>
    );
};

export default AdminTransactions;
