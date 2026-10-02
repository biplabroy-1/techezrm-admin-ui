'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { customerService } from '@/api/services/customers';
import { buildCreateCustomerPayload, type CustomerFormValues } from '@/components/modals/buildCreateCustomerPayload';
import { toast } from 'react-toastify';

/**
 * WHY THIS PAGE EXISTS
 * --------------------
 * `customers/page.tsx` has pushed to `/admin/data-management/customers/add` since
 * the button was written, but no `add/` directory ever existed - only `[id]/`.
 *
 * Next.js matches a static segment ahead of a dynamic one, so while only `[id]/`
 * was present that path was handled as "a customer whose id is the string
 * 'add'". The detail page then fetched customer "add", the server passed it to
 * `Customer.findById`, mongoose threw a CastError, and the admin saw:
 *
 *     Cast to ObjectId failed for value "add" (type string) at path "_id"
 *     for model "Customer"
 *
 * This file removes the top half of that. The bottom half - the server leaking
 * the driver's message - is fixed in `server/src/utils/customerIdGuard.ts`,
 * because a malformed id can arrive from any client, not only from this link.
 *
 * FIELDS
 * ------
 * Every field the CUSTOMER MODEL defines is offered, not a convenient subset:
 * an admin-created customer that cannot later have its `businessType` or
 * `employeeCount` filled in would be a record the edit screen cannot complete.
 * The enum option lists mirror `server/src/constants/static.ts` and the
 * `membershipTier` / `status` / `signupStep` enums in
 * `server/src/models/customer.ts` - sending a value outside one of those is a
 * ValidationError, which the create handler answers 400.
 *
 * `uniqueId` is deliberately absent: `models/customer.ts` has a pre-save hook
 * that assigns `EZ-CU-#####`, so a client-supplied value would be an
 * opportunity to collide, not to help.
 *
 * `password` is deliberately absent too: this screen creates a customer who can
 * log in through the OTP flow, and setting a password here would bypass
 * `approveCustomer` and leave `loginApproval` disagreeing with what the admin
 * can see on this form.
 */

type FormState = CustomerFormValues;

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  companyName: '',
  industry: '',
  website: '',
  employeeCount: '',
  annualRevenue: '',
  businessType: '',
  taxId: '',
  registrationNumber: '',
  contactPerson: '',
  contactPersonEmail: '',
  contactPersonPhone: '',
  notes: '',
  status: 'active',
  membershipTier: 'bronze',
  signupStep: 'approved',
};

/** Mirrors EMPLOYEE_COUNT in server/src/constants/static.ts. */
const EMPLOYEE_COUNTS = ['1-10', '11-50', '51-100', '101-250', '251-500', '501-1000', '1000+'];

/** Mirrors ANNUAL_REVENUE in server/src/constants/static.ts. */
const ANNUAL_REVENUES = [
  '< $100K',
  '$100K - $500K',
  '$500K - $1M',
  '$1M - $5M',
  '$5M - $10M',
  '$10M - $50M',
  '$50M+',
];

/** Mirrors BUSINESS_TYPE in server/src/constants/static.ts. */
const BUSINESS_TYPES = [
  'Manufacturing',
  'Retail',
  'Wholesale',
  'Healthcare',
  'Technology',
  'Food & Beverage',
  'Cosmetics',
  'Pharmaceuticals',
  'Agriculture',
  'Other',
];

const MEMBERSHIP_TIERS = ['bronze', 'silver', 'gold', 'platinum'];
const STATUSES = ['active', 'inactive', 'blocked'];
/** Mirrors SIGN_UP_STEP in server/src/constants/static.ts. */
const SIGN_UP_STEPS = [
  'otp_email_sent',
  'email_verified',
  'details_completed',
  'pending_approval',
  'approved',
];

export default function AddCustomerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const handleChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleSelect =
    (field: keyof FormState) =>
    (event: SelectChangeEvent<string>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) {
      next.name = 'Name is required';
    }
    if (!form.email.trim()) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    // The payload is built, not spread inline. Spreading `{...form}` sent `""` for
    // every dropdown left alone, and because businessType / annualRevenue /
    // employeeCount are ENUM fields on the model, mongoose rejected the whole
    // document for three fields the admin had never touched. See
    // `buildCreateCustomerPayload` for the rule and the test that pins it.
    mutationFn: () => customerService.createCustomer(buildCreateCustomerPayload(form)),
    onSuccess: (response) => {
      if (response?.success === false) {
        toast.error(response.message || 'Failed to create customer');
        return;
      }
      toast.success('Customer created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      router.push('/admin/data-management/customers');
    },
    onError: (err: any) => {
      // A duplicate email is the common case here, and the server restates it as
      // "that email is already registered" rather than leaking the index name.
      toast.error(err?.message || 'Failed to create customer');
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  };

  const handleCancel = () => {
    router.push('/admin/data-management/customers');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleCancel}
        disabled={mutation.isPending}
        sx={{ mb: 2 }}
      >
        Back to Customers
      </Button>

      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Add Customer
      </Typography>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Name"
                  value={form.name}
                  onChange={handleChange('name')}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={form.phone}
                  onChange={handleChange('phone')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="customer-status-label">Status</InputLabel>
                  <Select
                    labelId="customer-status-label"
                    label="Status"
                    value={form.status}
                    onChange={handleSelect('status')}
                  >
                    {STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="customer-tier-label">Membership Tier</InputLabel>
                  <Select
                    labelId="customer-tier-label"
                    label="Membership Tier"
                    value={form.membershipTier}
                    onChange={handleSelect('membershipTier')}
                  >
                    {MEMBERSHIP_TIERS.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="customer-signupstep-label">Signup Step</InputLabel>
                  <Select
                    labelId="customer-signupstep-label"
                    label="Signup Step"
                    value={form.signupStep}
                    onChange={handleSelect('signupStep')}
                  >
                    {SIGN_UP_STEPS.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={form.companyName}
                  onChange={handleChange('companyName')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Industry"
                  value={form.industry}
                  onChange={handleChange('industry')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Website"
                  placeholder="https://"
                  value={form.website}
                  onChange={handleChange('website')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="customer-business-type-label">Business Type</InputLabel>
                  <Select
                    labelId="customer-business-type-label"
                    label="Business Type"
                    value={form.businessType}
                    onChange={handleSelect('businessType')}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {BUSINESS_TYPES.map((b) => (
                      <MenuItem key={b} value={b}>
                        {b}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="customer-employee-count-label">Employee Count</InputLabel>
                  <Select
                    labelId="customer-employee-count-label"
                    label="Employee Count"
                    value={form.employeeCount}
                    onChange={handleSelect('employeeCount')}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {EMPLOYEE_COUNTS.map((e) => (
                      <MenuItem key={e} value={e}>
                        {e}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="customer-annual-revenue-label">Annual Revenue</InputLabel>
                  <Select
                    labelId="customer-annual-revenue-label"
                    label="Annual Revenue"
                    value={form.annualRevenue}
                    onChange={handleSelect('annualRevenue')}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {ANNUAL_REVENUES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Tax ID"
                  value={form.taxId}
                  onChange={handleChange('taxId')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Registration Number"
                  value={form.registrationNumber}
                  onChange={handleChange('registrationNumber')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={form.contactPerson}
                  onChange={handleChange('contactPerson')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Contact Person Email"
                  type="email"
                  value={form.contactPersonEmail}
                  onChange={handleChange('contactPersonEmail')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Contact Person Phone"
                  value={form.contactPersonPhone}
                  onChange={handleChange('contactPersonPhone')}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="Notes"
                  value={form.notes}
                  onChange={handleChange('notes')}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button onClick={handleCancel} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={mutation.isPending}
                startIcon={
                  mutation.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : undefined
                }
              >
                {mutation.isPending ? 'Creating...' : 'Create Customer'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}