'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Tooltip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  certificationTypeService,
  type CertificationType,
} from '@/api/services';
import {
  buildCertPayload,
  buildCertTogglePayload,
  type CertFormState,
} from './certForm';

/**
 * The certification-KIND screen (FSSAI, ISO 22000, KOSHER, HALAL - 10 rows in the
 * source).
 *
 * Not the per-product `Certification` documents, which are a different model with
 * certificateId/issuedBy/expiryDate. This is the global list that products point
 * at, so the only rich field is a PDF per row.
 */

const EMPTY_FORM: CertFormState = {
  name: '',
  description: '',
  iconName: '',
  displayOrder: 0,
  isActive: true,
  fileUrl: '',
};

export default function CertificationsListing() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CertificationType | null>(null);
  const [form, setForm] = useState<CertFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<CertificationType | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['certificationTypes'],
    queryFn: () => certificationTypeService.getAll(),
  });

  const types = data?.data || [];

  /**
   * Upload the certificate PDF through the S3-backed single-file endpoint.
   *
   * `/private/upload/single-cloud`, NOT `/single` - that path does not exist on
   * `upload.routes.ts`; the local-storage variants are `/single-local` and the
   * cloud one is `/single-cloud`, and a stored `fileUrl` has to be a cloud URL to be
   * reachable by the storefront. The response nests the URL at
   * `data.file.url`, not at `data.url`.
   */
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { api } = await import('@/api/config');
      const fd = new FormData();
      fd.append('file', file);
      const response = await api.post('/private/upload/single-cloud', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data?.file?.url as string | undefined;
    },
    onSuccess: (url) => {
      if (url) {
        setForm((prev) => ({ ...prev, fileUrl: url }));
        toast.success('Certificate uploaded');
      } else {
        toast.error('Upload succeeded but returned no URL');
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to upload certificate');
    },
  });

  const saveMutation = useMutation({
    // Built by a tested pure function. Every field goes out on every save, including
    // empty ones: findByIdAndUpdate strips `undefined`, so an omitted or undefined
    // key leaves the stored value in place and the admin gets a success toast for a
    // change that did not happen. That made the icon field unclearable and the "PDF
    // uploaded" chip's own delete button a complete no-op.
    mutationFn: async () => {
      const payload = buildCertPayload(form);
      return editing
        ? certificationTypeService.update(editing._id, payload)
        : certificationTypeService.create(payload);
    },
    onSuccess: () => {
      toast.success(
        editing ? 'Certification type updated!' : 'Certification type created!'
      );
      queryClient.invalidateQueries({ queryKey: ['certificationTypes'] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save certification type');
    },
  });

  /**
   * Flip isActive without opening the dialog.
   *
   * Goes through the general `PUT /:id`, since the server has no toggle endpoint.
   * The row's own values are carried along by `buildCertTogglePayload` rather than
   * sending `{ isActive }` alone: a partial write depends on the server reading an
   * absent key as "leave alone", which is the exact assumption that made the
   * clear-field controls on this page silently do nothing.
   */
  const toggleMutation = useMutation({
    mutationFn: (type: CertificationType) =>
      certificationTypeService.update(
        type._id,
        buildCertTogglePayload({
          _id: type._id,
          name: type.name,
          description: type.description ?? '',
          iconName: type.iconName ?? '',
          displayOrder: type.displayOrder,
          isActive: type.isActive,
          fileUrl: type.fileUrl ?? '',
        })
      ),
    onSuccess: () => {
      toast.success('Certification type updated');
      queryClient.invalidateQueries({ queryKey: ['certificationTypes'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to toggle certification type');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => certificationTypeService.remove(id),
    onSuccess: () => {
      toast.success('Certification type deleted!');
      queryClient.invalidateQueries({ queryKey: ['certificationTypes'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete certification type');
    },
  });

  function openAdd() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      // Default to the end rather than 0, so a new row does not jump to the top of
      // the storefront's certification strip.
      displayOrder:
        types.length > 0 ? Math.max(...types.map((t) => t.displayOrder)) + 1 : 0,
    });
    setFormOpen(true);
  }

  function openEdit(type: CertificationType) {
    setEditing(type);
    setForm({
      name: type.name,
      description: type.description || '',
      iconName: type.iconName || '',
      displayOrder: type.displayOrder,
      isActive: type.isActive,
      fileUrl: type.fileUrl || '',
    });
    setFormOpen(true);
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#F9FAFB', minHeight: '85vh', fontFamily: 'Poppins, sans-serif' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ fontSize: '24px', fontWeight: 'bold', color: '#1F2A44', fontFamily: 'Poppins, sans-serif' }}>
          Certification Types ({types.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{ fontWeight: 600, textTransform: 'none', backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
        >
          Add Certification Type
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load certification types. Please try again.
        </Alert>
      )}

      {!isLoading && !error && (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Icon</TableCell>
                  <TableCell>Certificate</TableCell>
                  <TableCell align="center">Active</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {types.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No certification types yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  types.map((type) => (
                    <TableRow key={type._id} hover>
                      <TableCell>{type.displayOrder}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>{type.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        {type.description || '—'}
                      </TableCell>
                      <TableCell>{type.iconName || '—'}</TableCell>
                      <TableCell>
                        {type.fileUrl ? (
                          // `target=_blank` with `rel="noopener noreferrer"`: without
                          // the rel, the opened tab gets a handle on this one via
                          // window.opener.
                          <Link
                            href={type.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                          >
                            View PDF
                          </Link>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={type.isActive}
                          onChange={() => toggleMutation.mutate(type)}
                          disabled={toggleMutation.isPending}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => openEdit(type)}
                              sx={{ color: '#ff9800' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => setDeleteTarget(type)}
                              sx={{ color: '#f44336' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Certification Type' : 'Add Certification Type'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              helperText="e.g. FSSAI, ISO 22000, KOSHER"
            />
            <TextField
              fullWidth
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Icon name"
              value={form.iconName}
              onChange={(e) => setForm({ ...form, iconName: e.target.value })}
              helperText="Optional. Icon identifier used in the storefront strip."
            />
            <TextField
              fullWidth
              label="Display order"
              type="number"
              value={form.displayOrder}
              onChange={(e) =>
                setForm({ ...form, displayOrder: parseInt(e.target.value, 10) || 0 })
              }
              helperText="Ascending. Lower numbers appear first."
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
              }
              label="Active"
            />

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Certificate PDF
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={
                    uploadMutation.isPending ? <CircularProgress size={16} /> : <UploadFileIcon />
                  }
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload PDF'}
                </Button>
                {form.fileUrl && (
                  <Chip
                    label="PDF uploaded"
                    color="success"
                    // This actually clears it now. It used to set fileUrl: '' while
                    // the payload omitted the key entirely, so findByIdAndUpdate kept
                    // the stored URL and reopening the dialog showed the PDF still
                    // attached - a control that did nothing at all.
                    onDelete={() => setForm({ ...form, fileUrl: '' })}
                  />
                )}
              </Box>
              {/* accept="application/pdf" is a filter, not validation - it does not
                  stop a drag-drop or a rename, and the server accepts whatever
                  arrives. */}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadMutation.mutate(file);
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            variant="contained"
            disabled={saveMutation.isPending || uploadMutation.isPending || !form.name.trim()}
            startIcon={saveMutation.isPending ? <CircularProgress size={16} /> : null}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Delete “{deleteTarget?.name}”? Products pointing at it will have no
            certificate kind to resolve. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}