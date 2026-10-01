'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  VerifiedUser as VerifiedIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { Customer } from '@/api/services/customers';

interface CustomerDetailsTabProps {
  customer?: Customer;
}

export default function CustomerDetailsTab({
  customer,
}: CustomerDetailsTabProps) {
  if (!customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          No customer data available
        </Typography>
      </Box>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMembershipColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return '#E5E4E2';
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Basic Information Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: 'primary.main',
                    mr: 2,
                    fontSize: '1.5rem',
                  }}
                >
                  {customer.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" component="h2">
                    {customer.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    ID: {customer.uniqueId}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List disablePadding>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={customer.email}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItem>

                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <PhoneIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone"
                    secondary={customer.phone || 'Not provided'}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItem>

                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CalendarIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Member Since"
                    secondary={formatDate(customer.createdAt)}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItem>

                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <AccountIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Signup Step"
                    secondary={customer.signupStep || 'Completed'}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItem>
              </List>

              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={customer.status}
                  color={
                    getStatusColor(customer.status) as
                      | 'success'
                      | 'error'
                      | 'default'
                  }
                  size="small"
                  icon={<VerifiedIcon />}
                />
                <Chip
                  label={`${customer.membershipTier} Member`}
                  sx={{
                    bgcolor: getMembershipColor(customer.membershipTier),
                    color: 'black',
                    fontWeight: 'bold',
                  }}
                  size="small"
                />
                {customer.loginApproval && (
                  <Chip
                    label="Login Approved"
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Company Information Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Company Information
              </Typography>

              <Divider sx={{ my: 2 }} />

              <List disablePadding>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText
                    primary="Company Name"
                    secondary={customer.companyName || 'Not provided'}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItem>

                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText
                    primary="Industry"
                    secondary={customer.industry || 'Not provided'}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItem>

                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText
                    primary="Business Type"
                    secondary={customer.businessType || 'Not provided'}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItem>

                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText
                    primary="Employee Count"
                    secondary={customer.employeeCount || 'Not provided'}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItem>

                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText
                    primary="Annual Revenue"
                    secondary={customer.annualRevenue || 'Not provided'}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItem>

                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText
                    primary="Website"
                    secondary={customer.website || 'Not provided'}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItem>

                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText
                    primary="Registration Number"
                    secondary={customer.registrationNumber || 'Not provided'}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItem>

                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText
                    primary="Tax ID"
                    secondary={customer.taxId || 'Not provided'}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 'medium',
                    }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Person Information */}
        {(customer.contactPerson ||
          customer.contactPersonEmail ||
          customer.contactPersonPhone) && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Contact Person
                </Typography>

                <Divider sx={{ my: 2 }} />

                <List disablePadding>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText
                      primary="Name"
                      secondary={customer.contactPerson || 'Not provided'}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: 'medium',
                      }}
                    />
                  </ListItem>

                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText
                      primary="Email"
                      secondary={customer.contactPersonEmail || 'Not provided'}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: 'medium',
                      }}
                    />
                  </ListItem>

                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText
                      primary="Phone"
                      secondary={customer.contactPersonPhone || 'Not provided'}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: 'medium',
                      }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Additional Notes */}
        {customer.notes && (
          <Grid size={{ xs: 12 }}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Additional Notes
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1">{customer.notes}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Metadata */}
        <Grid size={{ xs: 12 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Account Metadata
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(customer.createdAt)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(customer.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
