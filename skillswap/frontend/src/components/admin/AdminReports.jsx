import React, { useState, useEffect } from 'react';

const AdminReports = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month'); // Changed to month to see your data
    const [chartType, setChartType] = useState('bar');

    useEffect(() => {
        fetchReportData();
    }, [dateRange]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            console.log(`🔍 Fetching reports for range: ${dateRange}`);
            const response = await fetch(`http://localhost:5000/api/admin/reports?range=${dateRange}`);
            const data = await response.json();
            console.log('📊 Report Data Received:', data);
            
            if (data.success) {
                setReportData(data);
            } else {
                console.error('❌ API Error:', data.message);
            }
        } catch (error) {
            console.error('❌ Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = (type) => {
        alert(`📥 Exporting ${type} report as CSV...`);
    };

    // Helper function to render simple bar chart
    const renderBarChart = (data, color) => {
        if (!data || data.length === 0 || data.every(item => item.value === 0)) {
            return (
                <div style={{
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f7fafc',
                    borderRadius: '8px',
                    color: '#a0aec0',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '2rem' }}>📊</span>
                    <span>No data available</span>
                </div>
            );
        }

        const maxValue = Math.max(...data.map(d => d.value));
        
        return (
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '10px', padding: '10px 0' }}>
                {data.map((item, index) => (
                    <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: '100%',
                            height: maxValue > 0 ? `${(item.value / maxValue) * 150}px` : '20px',
                            background: color || '#4299e1',
                            borderRadius: '6px 6px 0 0',
                            transition: 'height 0.3s',
                            minHeight: '20px'
                        }} />
                        <div style={{ fontSize: '0.7rem', marginTop: '5px', color: '#718096', textAlign: 'center' }}>
                            {item.label}
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#2d3748' }}>
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Helper function to render pie chart
    const renderPieChart = (data) => {
        if (!data || data.length === 0 || data.every(item => item.value === 0)) {
            return (
                <div style={{
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f7fafc',
                    borderRadius: '8px',
                    color: '#a0aec0'
                }}>
                    No data available
                </div>
            );
        }

        const total = data.reduce((sum, item) => sum + item.value, 0);
        const colors = ['#4299e1', '#48bb78', '#f6ad55', '#fc8181', '#9f7aea', '#ed64a6'];
        let currentAngle = 0;

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                        {data.map((item, index) => {
                            if (item.value === 0) return null;
                            
                            const percentage = item.value / total;
                            const angle = percentage * 360;
                            const startAngle = currentAngle;
                            const endAngle = currentAngle + angle;
                            currentAngle = endAngle;

                            const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                            const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                            const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                            const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

                            const largeArcFlag = angle > 180 ? 1 : 0;

                            const pathData = [
                                `M 50 50`,
                                `L ${x1} ${y1}`,
                                `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                `Z`
                            ].join(' ');

                            return (
                                <path
                                    key={index}
                                    d={pathData}
                                    fill={colors[index % colors.length]}
                                    stroke="white"
                                    strokeWidth="1"
                                />
                            );
                        })}
                        <circle cx="50" cy="50" r="25" fill="white" />
                    </svg>
                </div>
                <div style={{ flex: 1 }}>
                    {data.map((item, index) => (
                        item.value > 0 && (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '3px',
                                    background: colors[index % colors.length]
                                }} />
                                <span style={{ fontSize: '0.85rem', color: '#4a5568' }}>{item.label}:</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#2d3748' }}>{item.value}</span>
                                <span style={{ fontSize: '0.75rem', color: '#718096' }}>
                                    ({Math.round((item.value / total) * 100)}%)
                                </span>
                            </div>
                        )
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ 
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #667eea',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                }} />
                <p style={{ color: '#718096' }}>Loading reports...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            {/* Header with date range selector */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <h2 style={{ margin: 0 }}>📈 Reports & Analytics</h2>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        style={{
                            padding: '8px 16px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            background: 'white',
                            fontSize: '0.9rem'
                        }}
                    >
                        <option value="day">Last 24 Hours</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last Year</option>
                        <option value="all">All Time</option>
                    </select>
                    
                    <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        style={{
                            padding: '8px 16px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            background: 'white',
                            fontSize: '0.9rem'
                        }}
                    >
                        <option value="bar">Bar Charts</option>
                        <option value="pie">Pie Charts</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                {/* User Growth Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>👥</span> User Growth
                    </h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                        {reportData?.newUsers || 0}
                    </div>
                    <div style={{ color: '#718096', marginBottom: '10px' }}>New Users ({dateRange})</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem' }}>Total: <strong>{reportData?.totalUsers || 0}</strong></span>
                        <button
                            onClick={() => exportToCSV('users')}
                            style={{
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            Export
                        </button>
                    </div>
                </div>

                {/* Swap Activity Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🔄</span> Swap Activity
                    </h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#48bb78' }}>
                        {reportData?.newSwaps || 0}
                    </div>
                    <div style={{ color: '#718096', marginBottom: '10px' }}>New Swaps ({dateRange})</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem' }}>Pending: <strong>{reportData?.pendingSwaps || 0}</strong></span>
                        <button
                            onClick={() => exportToCSV('swaps')}
                            style={{
                                background: '#48bb78',
                                color: 'white',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            Export
                        </button>
                    </div>
                </div>

                {/* Sessions Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>💬</span> Sessions
                    </h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f6ad55' }}>
                        {reportData?.completedSessions || 0}
                    </div>
                    <div style={{ color: '#718096', marginBottom: '10px' }}>Completed Sessions ({dateRange})</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem' }}>Rate: <strong>{reportData?.completionRate || 0}%</strong></span>
                        <button
                            onClick={() => exportToCSV('sessions')}
                            style={{
                                background: '#f6ad55',
                                color: 'white',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            Export
                        </button>
                    </div>
                </div>

                {/* Reviews Card - FIXED to show TOTAL reviews */}
                <div style={{
                    background: 'white',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>⭐</span> Reviews
                    </h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9f7aea' }}>
                        {reportData?.totalReviews || 0}
                    </div>
                    <div style={{ color: '#718096', marginBottom: '5px' }}>Total Reviews</div>
                    <div style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '10px' }}>
                        ({reportData?.newReviews || 0} new in selected period)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem' }}>Avg Rating: <strong>{reportData?.avgRating || '0.0'}</strong></span>
                        <button
                            onClick={() => exportToCSV('reviews')}
                            style={{
                                background: '#9f7aea',
                                color: 'white',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Debug Info - Remove after fixing */}
            {reportData && (
                <div style={{
                    marginBottom: '20px',
                    padding: '10px',
                    background: '#f0f0f0',
                    borderRadius: '5px',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace'
                }}>
                    <strong>Debug:</strong> Total Reviews: {reportData.totalReviews}, New Reviews: {reportData.newReviews}, Avg Rating: {reportData.avgRating}
                </div>
            )}

            {/* Charts Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '20px'
            }}>
                {/* User Activity Timeline */}
                <div style={{
                    background: 'white',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>📊 User Registrations (Last 7 Days)</span>
                        <button
                            onClick={() => exportToCSV('timeline')}
                            style={{
                                background: '#4299e1',
                                color: 'white',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            Export
                        </button>
                    </h3>
                    {renderBarChart(reportData?.userGrowth || [], '#4299e1')}
                </div>

                {/* Credit Flow */}
                <div style={{
                    background: 'white',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>💰 Credit Flow (All Time)</span>
                        <button
                            onClick={() => exportToCSV('credits')}
                            style={{
                                background: '#48bb78',
                                color: 'white',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            Export
                        </button>
                    </h3>
                    {chartType === 'pie' ? renderPieChart(reportData?.creditFlow || []) : renderBarChart(reportData?.creditFlow || [], '#48bb78')}
                </div>

                {/* Popular Skills */}
                <div style={{
                    background: 'white',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>🎯 Popular Skills (All Time)</span>
                        <button
                            onClick={() => exportToCSV('skills')}
                            style={{
                                background: '#f6ad55',
                                color: 'white',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            Export
                        </button>
                    </h3>
                    {reportData?.popularSkills && reportData.popularSkills.length > 0 ? (
                        chartType === 'pie' ? renderPieChart(reportData.popularSkills) : renderBarChart(reportData.popularSkills, '#f6ad55')
                    ) : (
                        <div style={{
                            height: '200px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f7fafc',
                            borderRadius: '8px',
                            color: '#a0aec0',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            <span style={{ fontSize: '2rem' }}>🎯</span>
                            <span>No skills added by users yet</span>
                        </div>
                    )}
                    
                    {/* Show top taught/learned breakdown */}
                    {(reportData?.topTaughtSkills?.length > 0 || reportData?.topLearnedSkills?.length > 0) && (
                        <div style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            {reportData.topTaughtSkills?.length > 0 && (
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#48bb78' }}>
                                        🎯 Most Taught
                                    </h4>
                                    {reportData.topTaughtSkills.map((skill, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span>{skill.label}</span>
                                            <span style={{ fontWeight: '600' }}>{skill.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {reportData.topLearnedSkills?.length > 0 && (
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#f56565' }}>
                                        📚 Most Learned
                                    </h4>
                                    {reportData.topLearnedSkills.map((skill, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span>{skill.label}</span>
                                            <span style={{ fontWeight: '600' }}>{skill.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Rating Distribution */}
                <div style={{
                    background: 'white',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>⭐ Rating Distribution (All Time)</span>
                        <button
                            onClick={() => exportToCSV('ratings')}
                            style={{
                                background: '#9f7aea',
                                color: 'white',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            Export
                        </button>
                    </h3>
                    {chartType === 'pie' ? renderPieChart(reportData?.ratingDistribution || []) : renderBarChart(reportData?.ratingDistribution || [], '#9f7aea')}
                </div>
            </div>

            {/* No Data Message */}
            {(!reportData?.totalUsers && !reportData?.totalReviews && !reportData?.popularSkills?.length) && (
                <div style={{
                    marginTop: '30px',
                    padding: '40px',
                    background: '#ebf8ff',
                    borderRadius: '10px',
                    textAlign: 'center',
                    color: '#2c5282'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
                    <h3>No Data Available</h3>
                    <p style={{ margin: '10px 0 0 0', fontSize: '0.95rem' }}>
                        Start using the platform to generate analytics.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminReports;