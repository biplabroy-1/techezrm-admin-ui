'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, type Customer } from '@/api/services/customers';
import { toast } from 'react-toastify';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = params.id as string;

  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  const {
    data: customerData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getCustomerById(customerId),
    enabled: !!customerId,
  });

  const customer = customerData?.data;

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        companyName: customer.companyName,
        industry: customer.industry,
        website: customer.website,
        employeeCount: customer.employeeCount,
        annualRevenue: customer.annualRevenue,
        businessType: customer.businessType,
        taxId: customer.taxId,
        registrationNumber: customer.registrationNumber,
        contactPerson: customer.contactPerson,
        contactPersonPhone: customer.contactPersonPhone,
        contactPersonEmail: customer.contactPersonEmail,
        notes: customer.notes,
        status: customer.status,
        membershipTier: customer.membershipTier,
      });
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Customer>) =>
      customerService.updateCustomer(customerId, data),
    onSuccess: () => {
      toast.success('Customer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update customer');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (notes: string) =>
      customerService.approveCustomer(customerId, notes),
    onSuccess: () => {
      toast.success('Customer approved successfully! Login credentials sent via email.');
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setAdminNotes('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to approve customer');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (notes: string) =>
      customerService.rejectCustomer(customerId, notes),
    onSuccess: () => {
      toast.success('Customer rejected');
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setRejectDialogOpen(false);
      setRejectNotes('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reject customer');
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleApprove = () => {
    approveMutation.mutate(adminNotes);
  };

  const handleReject = () => {
    if (!rejectNotes.trim()) return;
    rejectMutation.mutate(rejectNotes);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error instanceof Error ? error.message : 'Customer not found'}
        </Alert>
      </Box>
    );
  }

  const isPendingApproval = customer.signupStep === 'pending_approval';

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/admin/data-management/customers"
          onClick={(e) => {
            e.preventDefault();
            router.push('/admin/data-management/customers');
          }}
          sx={{ cursor: 'pointer' }}
        >
          Customers
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href={`/admin/data-management/customers/${customerId}`}
          onClick={(e) => {
            e.preventDefault();
            router.push(`/admin/data-management/customers/${customerId}`);
          }}
          sx={{ cursor: 'pointer' }}
        >
          {customer.name}
        </Link>
        <Typography color="text.primary">Edit</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Customer
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {customer.name} (ID: {customer.uniqueId})
          </Typography>
        </Box>

        {isPendingApproval && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip label="Pending Approval" color="warning" />
          </Box>
        )}
      </Box>

      {isPendingApproval && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#FFF8E1', border: '1px solid #FFE082' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#F57F17' }}>
            Pending Approval
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#795548' }}>
            This customer has completed signup and is waiting for your review. Approve to send login credentials or reject with feedback.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Admin notes (optional)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              sx={{ minWidth: 300 }}
            />
            <Button
              variant="contained"
              color="success"
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setRejectDialogOpen(true)}
              disabled={rejectMutation.isPending}
            >
              Reject
            </Button>
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Phone"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status || 'inactive'}
                label="Status"
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Membership Tier</InputLabel>
              <Select
                value={formData.membershipTier || 'bronze'}
                label="Membership Tier"
                onChange={(e) => handleChange('membershipTier', e.target.value)}
              >
                <MenuItem value="bronze">Bronze</MenuItem>
                <MenuItem value="silver">Silver</MenuItem>
                <MenuItem value="gold">Gold</MenuItem>
                <MenuItem value="platinum">Platinum</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Company Name"
              value={formData.companyName || ''}
              onChange={(e) => handleChange('companyName', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Industry"
              value={formData.industry || ''}
              onChange={(e) => handleChange('industry', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Website"
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Employee Count"
              value={formData.employeeCount || ''}
              onChange={(e) => handleChange('employeeCount', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Annual Revenue"
              value={formData.annualRevenue || ''}
              onChange={(e) => handleChange('annualRevenue', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Business Type"
              value={formData.businessType || ''}
              onChange={(e) => handleChange('businessType', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Tax ID"
              value={formData.taxId || ''}
              onChange={(e) => handleChange('taxId', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Registration Number"
              value={formData.registrationNumber || ''}
              onChange={(e) => handleChange('registrationNumber', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Contact Person"
              value={formData.contactPerson || ''}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Contact Person Phone"
              value={formData.contactPersonPhone || ''}
              onChange={(e) => handleChange('contactPersonPhone', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Contact Person Email"
              value={formData.contactPersonEmail || ''}
              onChange={(e) => handleChange('contactPersonEmail', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => router.push(`/admin/data-management/customers/${customerId}`)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Paper>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Customer</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Provide a reason for rejection. This will be sent to the customer via email.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            error={!rejectNotes.trim()}
            helperText={!rejectNotes.trim() ? 'Reason is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={rejectMutation.isPending || !rejectNotes.trim()}
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
