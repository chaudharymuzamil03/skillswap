import React, { useState, useEffect } from 'react';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        creditPerSession: 10,
        maxSessionsPerSkill: 20,
        minReputationForAdmin: 50,
        enableReviews: true,
        enableChat: true,
        maintenanceMode: false,
        sessionDurationMin: 30,
        sessionDurationMax: 120,
        creditBonusFirstReview: 5
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            // You'll need to create this endpoint
            const response = await fetch('http://localhost:5000/api/admin/settings');
            const data = await response.json();
            if (data.success) {
                setSettings(data.settings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: '✅ Settings saved successfully!' });
            } else {
                setMessage({ type: 'error', text: '❌ Failed to save settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: '❌ Network error' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleChange = (key, value) => {
        setSettings({...settings, [key]: value});
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>Loading settings...</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '30px' }}>⚙️ System Settings</h2>

            {message && (
                <div style={{
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: message.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    {message.text}
                </div>
            )}

            <div style={{
                background: 'white',
                borderRadius: '10px',
                padding: '30px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                {/* Credit Settings */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>💰 Credit System</h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                            Credits per Session
                        </label>
                        <input
                            type="number"
                            value={settings.creditPerSession}
                            onChange={(e) => handleChange('creditPerSession', parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '6px'
                            }}
                        />
                        <small style={{ color: '#718096' }}>Number of credits earned/spent per session</small>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                            First Review Bonus
                        </label>
                        <input
                            type="number"
                            value={settings.creditBonusFirstReview}
                            onChange={(e) => handleChange('creditBonusFirstReview', parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '6px'
                            }}
                        />
                        <small style={{ color: '#718096' }}>Bonus credits for first review</small>
                    </div>
                </div>

                {/* Session Settings */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>📅 Session Configuration</h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                            Max Sessions per Skill
                        </label>
                        <input
                            type="number"
                            value={settings.maxSessionsPerSkill}
                            onChange={(e) => handleChange('maxSessionsPerSkill', parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '6px'
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                Min Duration (minutes)
                            </label>
                            <input
                                type="number"
                                value={settings.sessionDurationMin}
                                onChange={(e) => handleChange('sessionDurationMin', parseInt(e.target.value))}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '6px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                Max Duration (minutes)
                            </label>
                            <input
                                type="number"
                                value={settings.sessionDurationMax}
                                onChange={(e) => handleChange('sessionDurationMax', parseInt(e.target.value))}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '6px'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Reputation Settings */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>⭐ Reputation System</h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                            Min Reputation for Admin
                        </label>
                        <input
                            type="number"
                            value={settings.minReputationForAdmin}
                            onChange={(e) => handleChange('minReputationForAdmin', parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '6px'
                            }}
                        />
                    </div>
                </div>

                {/* Feature Toggles */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>🔧 Feature Toggles</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <input
                            type="checkbox"
                            checked={settings.enableReviews}
                            onChange={(e) => handleChange('enableReviews', e.target.checked)}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <label style={{ fontWeight: '600' }}>Enable Reviews</label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <input
                            type="checkbox"
                            checked={settings.enableChat}
                            onChange={(e) => handleChange('enableChat', e.target.checked)}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <label style={{ fontWeight: '600' }}>Enable Chat</label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <input
                            type="checkbox"
                            checked={settings.maintenanceMode}
                            onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <label style={{ fontWeight: '600', color: settings.maintenanceMode ? '#f56565' : 'inherit' }}>
                            Maintenance Mode {settings.maintenanceMode ? '(Site will be inaccessible to users)' : ''}
                        </label>
                    </div>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            padding: '12px 30px',
                            background: saving ? '#a0aec0' : '#48bb78',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;