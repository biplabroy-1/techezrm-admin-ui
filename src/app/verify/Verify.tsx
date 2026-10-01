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
} from '@mui/material';
import Image from 'next/image';

const Verify = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Ensure this only runs on client side
  const [isClient, setIsClient] = useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  if (!isClient) return null; // Return nothing during SSR

  return (
    <Container
      maxWidth="lg"
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
      }}
      suppressHydrationWarning
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
              priority // Add priority for above-the-fold images
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
            <Box display="flex" alignItems="center" mb={2}>
              <Image
                src="/back.png"
                alt="Back arrow"
                width={30}
                height={20}
                priority
              />
              <Link
                href="/login"
                color="#333"
                sx={{ textDecoration: 'none', ml: 0.5, fontWeight: 600 }}
              >
                Back to login
              </Link>
            </Box>
            <Typography
              variant="h5"
              gutterBottom
              color="#333333"
              fontWeight="700"
            >
              Verify Code
            </Typography>
            <Typography
              variant="subtitle1"
              color="#333333"
              gutterBottom
              fontWeight="400"
              fontSize="14px"
              width="100%"
            >
              Don&apos;t worry, happens to all of us. Enter your email below to
              recover your password
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                placeholder="Enter code"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#e0e0e0',
                    },
                  },
                }}
              />
              <Typography
                variant="subtitle1"
                color="#333333"
                gutterBottom
                fontWeight="400"
                fontSize="16px"
                width="100%"
              >
                Didn&apos;t receive code,
                <span style={{ color: '#FF8682', textDecoration: 'underline' }}>
                  resend
                </span>
              </Typography>
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
                  Submit
                </Button>
              </Box>
            </form>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Verify;
