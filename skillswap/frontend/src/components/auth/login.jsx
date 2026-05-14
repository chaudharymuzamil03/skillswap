import React, { useState } from 'react';
import { authAPI } from '../../services/api';

const Login = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // Validation functions
    const validateName = (name) => {
        if (!name.trim()) return 'Name is required';
        if (name.length < 2) return 'Name must be at least 2 characters';
        if (name.length > 50) return 'Name must be less than 50 characters';
        
        // Check for numbers in name (allow letters, spaces, hyphens, apostrophes)
        const hasNumbers = /\d/.test(name);
        if (hasNumbers) return 'Name should not contain numbers';
        
        // Check for valid characters (allow international names)
        const validNameRegex = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u;
        if (!validNameRegex.test(name.trim())) return 'Please enter a valid name';
        
        return '';
    };

    const validateEmail = (email) => {
        if (!email.trim()) return 'Email is required';
        
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return 'Please enter a valid email address';
        
        return '';
    };

    const validatePassword = (password) => {
        if (!password) return 'Password is required';
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (password.length > 50) return 'Password must be less than 50 characters';
        
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
        if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
        if (!hasNumbers) return 'Password must contain at least one number';
        if (!hasSpecialChar) return 'Password must contain at least one special character';
        
        return '';
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData({
            ...formData,
            [id]: value
        });
        
        // Clear specific validation error when user types
        if (validationErrors[id]) {
            setValidationErrors({
                ...validationErrors,
                [id]: ''
            });
        }
        setError('');
    };

    const validateForm = () => {
        const errors = {};
        
        if (!isLogin) {
            const nameError = validateName(formData.name);
            if (nameError) errors.name = nameError;
        }
        
        const emailError = validateEmail(formData.email);
        if (emailError) errors.email = emailError;
        
        const passwordError = validatePassword(formData.password);
        if (passwordError) errors.password = passwordError;
        
        if (!isLogin && formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setValidationErrors({});
        
        // Validate form before submission
        if (!validateForm()) {
            setError('Please fix the errors in the form');
            return;
        }
        
        setLoading(true);

        try {
            if (isLogin) {
                // LOGIN with backend
                const result = await authAPI.login({
                    email: formData.email,
                    password: formData.password
                });

                if (result.success) {
                    onLogin(result.user);
                } else {
                    setError(result.message || 'Login failed. Please check your credentials.');
                }
            } else {
                // REGISTER with backend
                const result = await authAPI.register({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    password: formData.password
                });

                if (result.success) {
                    // Send welcome email (call your email service)
                    await sendWelcomeEmail(formData.email, formData.name);
                    
                    alert('Registration successful! A welcome email has been sent to your inbox.');
                    setIsLogin(true);
                    setFormData({
                        name: '',
                        email: '',
                        password: '',
                        confirmPassword: ''
                    });
                } else {
                    setError(result.message || 'Registration failed. Please try again.');
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Function to send welcome email
    const sendWelcomeEmail = async (email, name) => {
        try {
            // Call your backend email service
            await authAPI.sendWelcomeEmail({ email, name });
            console.log('Welcome email sent to:', email);
        } catch (error) {
            console.error('Failed to send welcome email:', error);
            // Don't show error to user - registration was successful
        }
    };

    // Password strength indicator
    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, text: '', color: '#e0e0e0' };
        
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/\d/.test(password)) strength += 1;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
        
        const colors = ['#ff4d4d', '#ff944d', '#ffd24d', '#a3ff4d', '#4dff88'];
        const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        
        return {
            strength: strength,
            text: texts[strength - 1] || '',
            color: colors[strength - 1] || '#e0e0e0'
        };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div style={{
            background: `
                linear-gradient(rgba(255, 255, 255, 0.20), rgba(255, 255, 255, 0.30)),
                url(/images/img%203.jpg)
            `,
            backgroundColor: '#f0f8ff',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            overflow: 'auto',
            zIndex: '1000'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '40px 30px',
                borderRadius: '20px',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.25)',
                width: '100%',
                maxWidth: '450px',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                margin: 'auto',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                {/* Logo/Title */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '30px'
                }}>
                    <h1 style={{
                        margin: '0',
                        fontSize: '28px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        SkillSwap
                    </h1>
                    <p style={{
                        color: '#666',
                        marginTop: '8px',
                        fontSize: '14px'
                    }}>
                        Exchange Skills • Earn Credits • Learn Together
                    </p>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    marginBottom: '30px',
                    borderBottom: '2px solid #f0f0f0'
                }}>
                    <div 
                        style={{
                            flex: 1,
                            padding: '12px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            fontWeight: '600',
                            color: isLogin ? '#667eea' : '#666',
                            borderBottom: isLogin ? '3px solid #667eea' : 'none',
                            transition: 'all 0.3s'
                        }} 
                        onClick={() => setIsLogin(true)}
                    >
                        Login
                    </div>
                    <div 
                        style={{
                            flex: 1,
                            padding: '12px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            fontWeight: '600',
                            color: !isLogin ? '#667eea' : '#666',
                            borderBottom: !isLogin ? '3px solid #667eea' : 'none',
                            transition: 'all 0.3s'
                        }} 
                        onClick={() => setIsLogin(false)}
                    >
                        Register
                    </div>
                </div>
                
                {/* Error Message */}
                {error && (
                    <div style={{
                        background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                        color: '#721c24',
                        padding: '14px',
                        borderRadius: '10px',
                        marginBottom: '25px',
                        border: '1px solid #f5c6cb',
                        fontSize: '14px',
                        textAlign: 'center',
                        fontWeight: '500'
                    }}>
                        ⚠️ {error}
                    </div>
                )}
                
                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <h2 style={{
                        textAlign: 'center', 
                        marginBottom: '25px', 
                        color: '#333',
                        fontSize: '20px',
                        fontWeight: '600'
                    }}>
                        {isLogin ? 'Welcome Back! ' : 'Start Your Journey '}
                    </h2>
                    
                    {/* Name Field (Register only) */}
                    {!isLogin && (
                        <div style={{ marginBottom: '18px' }}>
                            <input 
                                type="text" 
                                placeholder="Full Name" 
                                id="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: `2px solid ${validationErrors.name ? '#ff4d4d' : '#e0e0e0'}`,
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    backgroundColor: '#fff',
                                    transition: 'border 0.3s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => {
                                    e.target.style.borderColor = validationErrors.name ? '#ff4d4d' : '#e0e0e0';
                                    const error = validateName(e.target.value);
                                    if (error) {
                                        setValidationErrors(prev => ({...prev, name: error}));
                                    }
                                }}
                                required={!isLogin}
                            />
                            {validationErrors.name && (
                                <div style={{
                                    color: '#ff4d4d',
                                    fontSize: '12px',
                                    marginTop: '5px',
                                    paddingLeft: '5px'
                                }}>
                                    ⚠️ {validationErrors.name}
                                </div>
                            )}
                            <div style={{
                                fontSize: '12px',
                                color: '#666',
                                marginTop: '5px',
                                paddingLeft: '5px'
                            }}>
                                Tip: Enter your real name (no numbers allowed)
                            </div>
                        </div>
                    )}
                    
                    {/* Email Field */}
                    <div style={{ marginBottom: '18px' }}>
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            id="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: `2px solid ${validationErrors.email ? '#ff4d4d' : '#e0e0e0'}`,
                                borderRadius: '10px',
                                fontSize: '15px',
                                backgroundColor: '#fff',
                                transition: 'border 0.3s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => {
                                e.target.style.borderColor = validationErrors.email ? '#ff4d4d' : '#e0e0e0';
                                const error = validateEmail(e.target.value);
                                if (error) {
                                    setValidationErrors(prev => ({...prev, email: error}));
                                }
                            }}
                            required
                        />
                        {validationErrors.email && (
                            <div style={{
                                color: '#ff4d4d',
                                fontSize: '12px',
                                marginTop: '5px',
                                paddingLeft: '5px'
                            }}>
                                ⚠️ {validationErrors.email}
                            </div>
                        )}
                    </div>
                    
                    {/* Password Field */}
                    <div style={{ marginBottom: '18px' }}>
                        <input 
                            type="password" 
                            placeholder="Password" 
                            id="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: `2px solid ${validationErrors.password ? '#ff4d4d' : '#e0e0e0'}`,
                                borderRadius: '10px',
                                fontSize: '15px',
                                backgroundColor: '#fff',
                                transition: 'border 0.3s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => {
                                e.target.style.borderColor = validationErrors.password ? '#ff4d4d' : '#e0e0e0';
                                const error = validatePassword(e.target.value);
                                if (error) {
                                    setValidationErrors(prev => ({...prev, password: error}));
                                }
                            }}
                            required
                        />
                        {!isLogin && formData.password && (
                            <div style={{ marginTop: '10px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '5px'
                                }}>
                                    <div style={{
                                        flex: 1,
                                        height: '6px',
                                        backgroundColor: '#e0e0e0',
                                        borderRadius: '3px',
                                        overflow: 'hidden',
                                        marginRight: '10px'
                                    }}>
                                        <div style={{
                                            width: `${passwordStrength.strength * 20}%`,
                                            height: '100%',
                                            backgroundColor: passwordStrength.color,
                                            transition: 'all 0.3s'
                                        }} />
                                    </div>
                                    <span style={{
                                        fontSize: '12px',
                                        color: passwordStrength.color,
                                        fontWeight: '600'
                                    }}>
                                        {passwordStrength.text}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: validationErrors.password ? '#ff4d4d' : '#666',
                                    paddingLeft: '5px'
                                }}>
                                    Requirements: 8+ chars, uppercase, lowercase, number, special char
                                </div>
                            </div>
                        )}
                        {validationErrors.password && (
                            <div style={{
                                color: '#ff4d4d',
                                fontSize: '12px',
                                marginTop: '5px',
                                paddingLeft: '5px'
                            }}>
                                ⚠️ {validationErrors.password}
                            </div>
                        )}
                    </div>
                    
                    {/* Confirm Password (Register only) */}
                    {!isLogin && (
                        <div style={{ marginBottom: '25px' }}>
                            <input 
                                type="password" 
                                placeholder="Confirm Password" 
                                id="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: `2px solid ${validationErrors.confirmPassword ? '#ff4d4d' : '#e0e0e0'}`,
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    backgroundColor: '#fff',
                                    transition: 'border 0.3s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => {
                                    e.target.style.borderColor = validationErrors.confirmPassword ? '#ff4d4d' : '#e0e0e0';
                                    if (formData.password !== e.target.value) {
                                        setValidationErrors(prev => ({
                                            ...prev, 
                                            confirmPassword: 'Passwords do not match'
                                        }));
                                    }
                                }}
                                required={!isLogin}
                            />
                            {validationErrors.confirmPassword && (
                                <div style={{
                                    color: '#ff4d4d',
                                    fontSize: '12px',
                                    marginTop: '5px',
                                    paddingLeft: '5px'
                                }}>
                                    ⚠️ {validationErrors.confirmPassword}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '15px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '10px',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                        onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)')}
                        onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = 'none')}
                    >
                        {loading ? (
                            <>
                                <span style={{ marginRight: '8px' }}>⏳</span>
                                Processing...
                            </>
                        ) : (
                            <>
                                <span style={{ marginRight: '8px' }}>
                                    {isLogin ? '🔑' : '✨'}
                                </span>
                                {isLogin ? 'Login to SkillSwap' : 'Create Account'}
                            </>
                        )}
                    </button>
                </form>
                
                {/* Switch between Login/Register */}
                <div style={{
                    textAlign: 'center', 
                    marginTop: '25px', 
                    color: '#666',
                    fontSize: '14px'
                }}>
                    <p style={{ margin: '0' }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <a 
                            href="#" 
                            onClick={(e) => {
                                e.preventDefault();
                                setIsLogin(!isLogin);
                                setError('');
                                setValidationErrors({});
                            }}
                            style={{
                                color: '#667eea', 
                                textDecoration: 'none',
                                fontWeight: '600',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                transition: 'background 0.3s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(102, 126, 234, 0.1)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                            {isLogin ? 'Create Account' : 'Sign In'}
                        </a>
                    </p>
                </div>

                {/* Features */}
                {/* <div style={{
                    marginTop: '30px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: '#555',
                    textAlign: 'center'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center' }}>🎯 Skill Matching</span>
                        <span style={{ display: 'flex', alignItems: 'center' }}>💬 Live Chat</span>
                        <span style={{ display: 'flex', alignItems: 'center' }}>⭐ Earn Credits</span>
                    </div>
                    
                </div> */}

                {/* Footer */}
                <div style={{
                    marginTop: '25px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#888',
                    borderTop: '1px solid #eee',
                    paddingTop: '15px'
                }}>
                    <p style={{ margin: '0' }}>
                        By continuing, you agree to our Terms & Privacy Policy
                    </p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '11px' }}>
                        A welcome email will be sent upon registration
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login;
