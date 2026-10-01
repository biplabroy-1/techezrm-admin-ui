'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Container,
  Grid,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  // Snackbar,
  FormHelperText,
} from '@mui/material';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/api';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
}

const Signup = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedOption, setSelectedOption] = useState(''); // State for dropdown
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: register, isPending } = useMutation({
    mutationFn: authService.register,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess: (success) => {
      toast.success('Registration successful | Please wait for admin approval');
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: '',
      });
      setSelectedOption('');
      setErrors({});
      router.push('/login');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error?.errors?.[0]?.message || error?.message);
    },
  });

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'firstName':
        return value.trim() ? '' : 'First name is required';
      case 'lastName':
        return value.trim() ? '' : 'Last name is required';
      case 'email':
        if (!value.trim()) return 'Email is required';
        return validateEmail(value) ? '' : 'Please enter a valid email address';
      case 'password':
        if (!value.trim()) return 'Password is required';
        return validatePassword(value)
          ? ''
          : 'Password must be at least 6 characters';
      case 'role':
        return value ? '' : 'Please select a role';
      default:
        return '';
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    newErrors.firstName = validateField('firstName', form.firstName);
    newErrors.lastName = validateField('lastName', form.lastName);
    newErrors.email = validateField('email', form.email);
    newErrors.password = validateField('password', form.password);
    newErrors.role = validateField('role', selectedOption);

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      register({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
        role: selectedOption,
      });
    } else {
      toast.error('Please fix the errors in the form');
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleRoleChange = (value: string) => {
    setSelectedOption(value);
    if (errors.role) {
      setErrors((prev) => ({ ...prev, role: '' }));
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}
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
              priority={true}
            />
          </Box>
        </Grid>
        <Grid>
          <Box sx={{ maxWidth: 400, margin: '0 auto', padding: 3 }}>
            <Typography
              variant="h5"
              gutterBottom
              color="#333333"
              fontWeight="700"
            >
              Hello!
            </Typography>
            <Typography
              variant="subtitle1"
              color="#333333"
              gutterBottom
              fontWeight="400"
            >
              Sign Up to Get Started
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                placeholder="First Name"
                variant="outlined"
                margin="normal"
                value={form.firstName}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
                InputLabelProps={{ shrink: false }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Image
                        src="/user.png"
                        alt="User Icon"
                        width={20}
                        height={20}
                      />
                    </InputAdornment>
                  ),
                  sx: {
                    '& fieldset': {
                      borderColor: errors.firstName ? '#d32f2f' : '#e0e0e0',
                      borderRadius: '30px',
                    },
                    '&:hover fieldset': {
                      borderColor: errors.firstName ? '#d32f2f' : '#e0e0e0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: errors.firstName ? '#d32f2f' : '#e0e0e0',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                placeholder="Last Name"
                variant="outlined"
                margin="normal"
                value={form.lastName}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
                InputLabelProps={{ shrink: false }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Image
                        src="/user.png"
                        alt="User Icon"
                        width={20}
                        height={20}
                      />
                    </InputAdornment>
                  ),
                  sx: {
                    '& fieldset': {
                      borderColor: errors.lastName ? '#d32f2f' : '#e0e0e0',
                      borderRadius: '30px',
                    },
                    '&:hover fieldset': {
                      borderColor: errors.lastName ? '#d32f2f' : '#e0e0e0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: errors.lastName ? '#d32f2f' : '#e0e0e0',
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                placeholder="Email Address"
                variant="outlined"
                margin="normal"
                value={form.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                InputLabelProps={{ shrink: false }}
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
                    '& fieldset': {
                      borderColor: errors.email ? '#d32f2f' : '#e0e0e0',
                      borderRadius: '30px',
                    },
                    '&:hover fieldset': {
                      borderColor: errors.email ? '#d32f2f' : '#e0e0e0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: errors.email ? '#d32f2f' : '#e0e0e0',
                    },
                  },
                }}
              />

              {/* Role Dropdown Field */}
              <FormControl fullWidth margin="normal" error={!!errors.role}>
                <Select
                  value={selectedOption}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  displayEmpty
                  inputProps={{}}
                  sx={{
                    borderRadius: '30px',
                    '& fieldset': {
                      borderColor: errors.role ? '#d32f2f' : '#e0e0e0',
                      borderRadius: '30px',
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        border: `1px solid ${errors.role ? '#d32f2f' : '#e0e0e0'}`,
                      },
                      '&:hover fieldset': {
                        border: `1px solid ${errors.role ? '#d32f2f' : '#e0e0e0'}`,
                      },
                      '&.Mui-focused fieldset': {
                        border: `1px solid ${errors.role ? '#d32f2f' : '#e0e0e0'}`,
                      },
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    Select Role
                  </MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="MANAGER">Manager</MenuItem>
                  <MenuItem value="STAFF">Staff</MenuItem>
                </Select>
                {errors.role && (
                  <FormHelperText sx={{ color: '#d32f2f', ml: 1.5 }}>
                    {errors.role}
                  </FormHelperText>
                )}
              </FormControl>

              <TextField
                fullWidth
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                margin="normal"
                value={form.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                InputLabelProps={{ shrink: false }}
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
                    '& fieldset': {
                      borderColor: errors.password ? '#d32f2f' : '#e0e0e0',
                      borderRadius: '30px',
                    },
                    '&:hover fieldset': {
                      borderColor: errors.password ? '#d32f2f' : '#e0e0e0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: errors.password ? '#d32f2f' : '#e0e0e0',
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
                  loading={isPending}
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 2,
                    mb: 2,
                    p: 2,
                    backgroundColor: '#F9A922',
                    '&:hover': { backgroundColor: '#F9A922' },
                    borderRadius: '30px',
                    fontWeight: 700,
                    fontFamily: 'Poppins, sans-serif',
                    textTransform: 'none',
                  }}
                >
                  {isPending ? 'Signing Up...' : 'Sign Up'}
                </Button>
                <Link
                  href="/login"
                  color="error"
                  sx={{ textDecoration: 'none', mt: 1 }}
                >
                  Already have an account? Login
                </Link>
              </Box>
            </form>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Signup;
