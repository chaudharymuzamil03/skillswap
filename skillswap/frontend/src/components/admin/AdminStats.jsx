// AdminStats.jsx - Professional Version
import React from 'react';

const AdminStats = ({ stats }) => {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>👥</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#0066cc' }}>{stats?.totalUsers || 0}</div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>Total Users</div>
                <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '8px' }}>
                    👑 {stats?.adminUsers || 0} Admins
                </div>
            </div>

            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>🔄</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#28a745' }}>{stats?.totalSwapRequests || 0}</div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>Total Swaps</div>
                <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '8px' }}>
                    ⏳ {stats?.pendingRequests || 0} Pending
                </div>
            </div>

            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>💬</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#ffc107' }}>{stats?.totalSessions || 0}</div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>Total Sessions</div>
                <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '8px' }}>
                    ⭐ {stats?.totalReviews || 0} Reviews
                </div>
            </div>

            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>📊</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc3545' }}>{stats?.activeUsers || 0}</div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '5px' }}>Active Users</div>
                <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '8px' }}>
                    🎯 {stats?.usersWithSkills || 0} with skills
                </div>
            </div>
        </div>
    );
};

export default AdminStats;
