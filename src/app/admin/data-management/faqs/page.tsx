'use client';

import React, { useState, useEffect } from 'react';
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { faqService, productService, type FAQ } from '@/api/services';

/**
 * The FAQ management screen.
 *
 * Every endpoint it uses already existed on the server (`/private/faqs`, including
 * `PATCH /bulk/orders`) - only this screen was missing.
 *
 * Ordering is the interesting part. The server applies whatever `{ id, order }`
 * pairs it is given and does nothing else, so the up/down buttons send only the two
 * rows being swapped rather than renumbering the visible set: renumbering would
 * reorder rows the admin never touched, and with 717 FAQs across keys those rows
 * are not even in the same list.
 */

const FAQ_KEYS: FAQ['key'][] = [
  'product',
  'general',
  'shipping',
  'payment',
  'account',
  'technical',
  'other',
];

const KEY_LABELS: Record<FAQ['key'], string> = {
  product: 'Product',
  general: 'General',
  shipping: 'Shipping',
  payment: 'Payment',
  account: 'Account',
  technical: 'Technical',
  other: 'Other',
};

/** Long answers would dominate the table; the full text is in the edit dialog. */
function truncate(text: string, max = 80): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

interface FAQFormState {
  question: string;
  answer: string;
  key: FAQ['key'];
  entityId: string;
  order: number;
  isActive: boolean;
}

const EMPTY_FORM: FAQFormState = {
  question: '',
  answer: '',
  key: 'general',
  entityId: '',
  order: 0,
  isActive: true,
};

export default function FAQsListing() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const rowsPerPage = 25;
  const [keyFilter, setKeyFilter] = useState<FAQ['key'] | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState<FAQFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 whenever the query changes, or a filter that narrowed to 3
  // rows would leave the pagination showing "page 7 of 1" with an empty table.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, keyFilter]);

  const {
    data: faqsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['faqs', { page, search: debouncedSearchTerm, key: keyFilter }],
    queryFn: () =>
      faqService.getAll({
        page,
        limit: rowsPerPage,
        search: debouncedSearchTerm || undefined,
        key: keyFilter || undefined,
      }),
  });

  /**
   * Product names for the `entityId` column.
   *
   * A page of 25 FAQs is at most 25 products, but the listing is paged and a global
   * product fetch would be a 240-row download on every page. Fetching one page of
   * products is enough to label whatever is on screen; anything unresolved renders
   * as the raw id rather than blank, so a stale cache degrades visibly instead of
   * looking like missing data.
   */
  const { data: productsData } = useQuery({
    queryKey: ['products', { page: 1, limit: 100 }],
    queryFn: () => productService.getProducts({ page: 1, limit: 100 }),
  });

  const productNames: Record<string, string> = {};
  for (const product of productsData?.products || []) {
    if (product?._id) productNames[product._id] = product.name;
  }

  const faqs = faqsData?.data || [];
  // The count is NESTED under `pagination`. Reading a top-level `total` - which is
  // what the Categories listing used to do - silently yields 0 and renders "0
  // Results" above a populated table.
  const totalResults = faqsData?.pagination?.total ?? 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        key: form.key,
        // Trimmed, and `undefined` rather than `''` when blank: `entityId` is
        // optional, and an empty string is a real (wrong) value that would make the
        // row look attached to something.
        entityId: form.entityId.trim() || undefined,
        entityType: form.entityId.trim() ? 'product' : undefined,
        order: Number(form.order) || 0,
        isActive: form.isActive,
      };
      return editing
        ? faqService.update(editing._id, payload)
        : faqService.create(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'FAQ updated successfully!' : 'FAQ created successfully!');
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setFormOpen(false);
      setEditing(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save FAQ');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => faqService.remove(id),
    onSuccess: () => {
      toast.success('FAQ deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete FAQ');
    },
  });

  /**
   * Swap two adjacent rows' orders.
   *
   * Both rows are sent because a one-sided update would give two FAQs the same
   * order, and the server's sort is `{ order: 1 }` - ties then resolve by whatever
   * Mongo decides, so the button would appear to do nothing on some saves and
   * reorder on others.
   *
   * The neighbour is taken from the CURRENT page only. Moving the last row on a page
   * up therefore swaps it with the last row on the previous page, whose order this
   * client never loaded; the up button is disabled on the first row of the first
   * page for the same reason at the other end.
   */
  const reorderMutation = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const other = faqs[index + direction];
      if (!other) return;
      return faqService.bulkUpdateOrders([
        { id: faqs[index]._id, order: other.order },
        { id: other._id, order: faqs[index].order },
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to reorder FAQs');
    },
  });

  function openAdd() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      // Default to the end of the current list rather than 0, which would put a new
      // FAQ at the top of the storefront FAQ section.
      order: faqs.length > 0 ? Math.max(...faqs.map((f) => f.order)) + 1 : 0,
    });
    setFormOpen(true);
  }

  function openEdit(faq: FAQ) {
    setEditing(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      key: faq.key,
      entityId: faq.entityId || '',
      order: faq.order,
      isActive: faq.isActive,
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#F9FAFB', minHeight: '85vh', fontFamily: 'Poppins, sans-serif' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography sx={{ fontSize: '24px', fontWeight: 'bold', color: '#1F2A44', fontFamily: 'Poppins, sans-serif' }}>
          FAQs ({totalResults})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{ fontWeight: 600, textTransform: 'none', backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
        >
          Add FAQ
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Search FAQs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search question, answer or key..."
          sx={{ minWidth: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Key</InputLabel>
          <Select
            label="Key"
            value={keyFilter}
            onChange={(e) => setKeyFilter(e.target.value as FAQ['key'] | '')}
          >
            <MenuItem value="">All Keys</MenuItem>
            {FAQ_KEYS.map((key) => (
              <MenuItem key={key} value={key}>
                {KEY_LABELS[key]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load FAQs. Please try again.
        </Alert>
      )}

      {!isLoading && !error && (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Question</TableCell>
                  <TableCell>Answer</TableCell>
                  <TableCell>Key</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {faqs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No FAQs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  faqs.map((faq, index) => (
                    <TableRow key={faq._id} hover>
                      <TableCell>{faq.order}</TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>{faq.question}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>{truncate(faq.answer)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={KEY_LABELS[faq.key] ?? faq.key} />
                      </TableCell>
                      <TableCell>
                        {/* Raw id as a fallback, never blank: an unresolved name
                            should look unresolved, not look like no product. */}
                        {faq.entityId
                          ? productNames[faq.entityId] || faq.entityId
                          : '—'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          color={faq.isActive ? 'success' : 'default'}
                          label={faq.isActive ? 'Active' : 'Inactive'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Move up">
                            <span>
                              <IconButton
                                size="small"
                                // Disabled on the first row of the first page: its
                                // neighbour lives on the previous page, whose orders
                                // this client has not loaded.
                                disabled={index === 0 && page === 1}
                                onClick={() =>
                                  reorderMutation.mutate({ index, direction: -1 })
                                }
                                sx={{ color: '#1976d2' }}
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Move down">
                            <span>
                              <IconButton
                                size="small"
                                // ...and on the last row of the last page.
                                disabled={
                                  index === faqs.length - 1 &&
                                  page * rowsPerPage >= totalResults
                                }
                                onClick={() =>
                                  reorderMutation.mutate({ index, direction: 1 })
                                }
                                sx={{ color: '#1976d2' }}
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => openEdit(faq)}
                              sx={{ color: '#ff9800' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => setDeleteTarget(faq)}
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
          <TablePagination
            component="div"
            count={totalResults}
            page={Math.max(0, Math.min(page - 1, Math.max(0, Math.ceil(totalResults / rowsPerPage) - 1)))}
            onPageChange={(_, newPage) => setPage(newPage + 1)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[rowsPerPage]}
          />
        </Paper>
      )}

      {/* Add / Edit dialog. Question and answer only - everything else is set by the
          table (order) or is not worth an input (isActive defaults on). */}
      <Dialog open={formOpen} onClose={closeForm} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Question"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Answer"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              multiline
              rows={5}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Key</InputLabel>
              <Select
                label="Key"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value as FAQ['key'] })}
              >
                {FAQ_KEYS.map((key) => (
                  <MenuItem key={key} value={key}>
                    {KEY_LABELS[key]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Product ID"
              value={form.entityId}
              onChange={(e) => setForm({ ...form, entityId: e.target.value })}
              helperText="Optional. Leave blank for a global FAQ."
            />
            <TextField
              fullWidth
              label="Order"
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeForm} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            variant="contained"
            disabled={saveMutation.isPending || !form.question.trim() || !form.answer.trim()}
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
            Delete “{deleteTarget?.question}”? This cannot be undone.
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