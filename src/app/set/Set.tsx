/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Grid,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { BASE_URL } from '@/api/config/endpoints';

const Set = () => {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    otp: '',
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Get email from sessionStorage (passed from forgot password page)
    const getResetData = () => {
      try {
        if (typeof window !== 'undefined') {
          const resetData = sessionStorage.getItem('resetData');

          if (resetData) {
            const data = JSON.parse(resetData);

            // Check if data is recent (within 15 minutes)
            if (Date.now() - data.timestamp < 15 * 60 * 1000) {
              setUserEmail(data.email);
            } else {
              // Data expired, redirect back
              setError(
                'Session expired. Please restart the password reset process.'
              );
              setTimeout(() => {
                router.push('/forgot');
              }, 3000);
            }
          } else {
            // No reset data found
            setError(
              'No reset session found. Please restart the password reset process.'
            );
            setTimeout(() => {
              router.push('/forgot');
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error reading reset data:', error);
        setError('Failed to load reset session. Please try again.');
        setTimeout(() => {
          router.push('/forgot');
        }, 3000);
      }
    };

    getResetData();
  }, [isClient, router]);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors = {
      password: '',
      confirmPassword: '',
      otp: '',
    };

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!otp) {
      newErrors.otp = 'OTP is required';
    } else if (otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = 'OTP must contain only numbers';
    }

    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirmPassword && !newErrors.otp;
  };

  // API call function for password reset verification
  const verifyPasswordReset = async (
    email: string,
    otp: string,
    newPassword: string
  ) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/password/reset-verify`,
        {
          email: email,
          otp: otp,
          newPassword: newPassword,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to verify password reset'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    if (!userEmail) {
      setError('Email not found. Please restart the password reset process.');
      return;
    }

    setIsLoading(true);

    try {
      await verifyPasswordReset(userEmail, otp, password);

      setSuccess(
        'Password has been reset successfully! Redirecting to login...'
      );

      // Clear stored reset data
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('resetData');
      }

      // Clear form
      setPassword('');
      setConfirmPassword('');
      setOtp('');

      // Redirect to login
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: '' }));
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  if (!isClient) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-around"
        width="100%"
      >
        <Grid>
          <Box sx={{ textAlign: 'center' }}>
            <Image
              src="/Logo.png"
              alt="EZRM Logo"
              width={429}
              height={229}
              priority
            />
          </Box>
        </Grid>
        <Grid>
          <Box
            sx={{
              maxWidth: 400,
              margin: '0 auto',
              padding: 3,
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              color="#333333"
              fontWeight="700"
            >
              Set a password
            </Typography>
            <Typography
              variant="subtitle1"
              color="#333333"
              gutterBottom
              fontWeight="400"
              fontSize="14px"
              width="100%"
            >
              Enter the OTP sent to your email and set a new password for your
              account.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email Field - Pre-filled and Disabled */}
              <TextField
                fullWidth
                placeholder="Email Address"
                type="email"
                variant="outlined"
                margin="normal"
                value={userEmail}
                disabled={true}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Image
                        src="/mailIcon.png"
                        alt="Mail Icon"
                        width={20}
                        height={20}
                      />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '30px',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderRadius: '30px',
                    },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '30px',
                    backgroundColor: '#f5f5f5',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#f5f5f5',
                      '& .MuiInputBase-input': {
                        color: '#666666',
                        '-webkit-text-fill-color': '#666666',
                      },
                    },
                  },
                }}
              />

              {/* OTP Field */}
              <TextField
                fullWidth
                placeholder="Enter OTP (6 digits)"
                type="text"
                variant="outlined"
                margin="normal"
                value={otp}
                onChange={handleOtpChange}
                error={!!errors.otp}
                helperText={errors.otp}
                disabled={isLoading}
                inputProps={{ maxLength: 6 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Image
                        src="/lockIcon.png"
                        alt="OTP Icon"
                        width={20}
                        height={20}
                      />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '30px',
                    '& fieldset': {
                      borderColor: errors.otp ? '#f44336' : '#e0e0e0',
                      borderRadius: '30px',
                    },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '30px',
                    '& fieldset': {
                      borderColor: errors.otp ? '#f44336' : '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: errors.otp ? '#f44336' : '#e0e0e0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: errors.otp ? '#f44336' : '#1976d2',
                    },
                  },
                }}
              />

              {/* Create Password Field */}
              <TextField
                fullWidth
                placeholder="Create Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                margin="normal"
                value={password}
                onChange={handlePasswordChange}
                error={!!errors.password}
                helperText={errors.password}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Image
                        src="/lockIcon.png"
                        alt="Lock Icon"
                        width={20}
                        height={20}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        disabled={isLoading}
                      >
                        <Image
                          src="/eye.png"
                          alt={showPassword ? 'Hide password' : 'Show password'}
                          width={20}
                          height={20}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '30px',
                    '& fieldset': {
                      borderColor: errors.password ? '#f44336' : '#e0e0e0',
                      borderRadius: '30px',
                    },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '30px',
                    '& fieldset': {
                      borderColor: errors.password ? '#f44336' : '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: errors.password ? '#f44336' : '#e0e0e0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: errors.password ? '#f44336' : '#1976d2',
                    },
                  },
                }}
              />

              {/* Confirm Password Field */}
              <TextField
                fullWidth
                placeholder="Re-enter Password"
                type={showConfirmPassword ? 'text' : 'password'}
                variant="outlined"
                margin="normal"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Image
                        src="/lockIcon.png"
                        alt="Lock Icon"
                        width={20}
                        height={20}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showConfirmPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                        onClick={handleToggleConfirmPasswordVisibility}
                        edge="end"
                        disabled={isLoading}
                      >
                        <Image
                          src="/eye.png"
                          alt={
                            showConfirmPassword
                              ? 'Hide password'
                              : 'Show password'
                          }
                          width={20}
                          height={20}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '30px',
                    '& fieldset': {
                      borderColor: errors.confirmPassword
                        ? '#f44336'
                        : '#e0e0e0',
                      borderRadius: '30px',
                    },
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '30px',
                    '& fieldset': {
                      borderColor: errors.confirmPassword
                        ? '#f44336'
                        : '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: errors.confirmPassword
                        ? '#f44336'
                        : '#e0e0e0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: errors.confirmPassword
                        ? '#f44336'
                        : '#1976d2',
                    },
                  },
                }}
              />

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isLoading || !userEmail}
                  sx={{
                    mt: 2,
                    mb: 2,
                    p: 2,
                    backgroundColor: '#F9A922',
                    '&:hover': { backgroundColor: '#E6951D' },
                    '&:disabled': { backgroundColor: '#cccccc' },
                    borderRadius: '30px',
                    fontWeight: 700,
                    fontFamily: 'Poppins, sans-serif',
                    textTransform: 'none',
                    position: 'relative',
                  }}
                >
                  {isLoading && (
                    <CircularProgress
                      size={20}
                      sx={{
                        color: '#fff',
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        marginLeft: '-10px',
                        marginTop: '-10px',
                      }}
                    />
                  )}
                  {isLoading ? 'Setting Password...' : 'Set Password'}
                </Button>
              </Box>
            </form>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                textAlign: 'center',
                mt: 1,
                fontSize: '12px',
              }}
            >
              Enter the 6-digit OTP sent to your email address.
            </Typography>

            {!userEmail && !isLoading && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                No email found. Please restart the password reset process from
                the forgot password page.
                <Button
                  onClick={() => router.push('/forgot')}
                  sx={{ ml: 1, textTransform: 'none' }}
                  size="small"
                >
                  Go to Forgot Password
                </Button>
              </Alert>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Set;
