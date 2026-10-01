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
import {
  buildFaqPayload,
  swapOrderUpdates,
  nextFaqOrder,
  makeReorderNoop,
  isReorderNoop,
  type FAQFormState,
} from './faqForm';

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

/**
 * What a reorder that found nothing to do returns.
 *
 * A unique symbol, not `undefined` or `null`, because react-query counts a resolved
 * `undefined` as SUCCESS and calls `onSuccess` - so an early return in `mutationFn`
 * still toasted "FAQ moved up" for a move that never happened. A symbol cannot
 * collide with a real `FAQResponse`, and comparing against it is unambiguous.
 *
 * Built per-module and matched by identity through `isReorderNoop`, so the guard is
 * unit testable without depending on this copy.
 */
const REORDER_NOOP = makeReorderNoop();

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
   * The collection's highest `order`, so a new FAQ lands at the end.
   *
   * A single-row query sorted descending, rather than a max over the visible 25-row
   * page. Both `sortBy` and `sortOrder` are passed explicitly: they depend on
   * server-side defaults in `faq.controller.ts`, and an edited default would
   * otherwise silently move where new FAQs land.
   */
  const maxOrderQuery = useQuery({
    queryKey: ['faqs', { maxOrder: true }],
    // `sortOrder: 'desc'` is what makes this the MAX and not the min. Without it the
    // server's default ascending order returns the lowest-ordered row, and a new FAQ
    // would be created at `0 + 1` - colliding with the imported rows that sit at 0.
    queryFn: () =>
      faqService.getAll({
        page: 1,
        limit: 1,
        sortBy: 'order',
        sortOrder: 'desc',
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
    // The payload is built by a tested pure function: every field is sent on every
    // save, INCLUDING empty ones, because findByIdAndUpdate strips `undefined` and a
    // blank field would otherwise keep its stored value while reporting success.
    mutationFn: async () => {
      const payload = buildFaqPayload(form);
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

  /**
   * Soft delete, not hard.
   *
   * The server has always exposed `PATCH /:id/soft-delete` alongside the hard
   * `DELETE /:id` (faq.routes.ts), and this screen was calling the hard one. On a
   * collection of 717 migrated FAQs an accidental hard delete is unrecoverable -
   * there is no trash, and the migration script refuses to run against a non-empty
   * target, so a re-import is not a safety net.
   *
   * `isActive` is already what soft delete flips, so a soft-deleted row stops being
   * served by the storefront while remaining here to be reactivated by an admin.
   */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => faqService.softDelete(id),
    onSuccess: () => {
      toast.success('FAQ removed');
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to remove FAQ');
    },
  });

  /**
   * Move one row up or down.
   *
   * The swap itself is the tested pure function `swapOrderUpdates`, because it has to
   * handle the case this table will mostly be in: two neighbours sharing an order.
   * `order` defaults to 0, the 717 imported rows were not given distinct values, and
   * the default view is unfiltered across all seven keys - so equal-order neighbours
   * are the norm. Emitting the naive swap there sends two identical writes and the
   * result is whatever Mongo decides for a tie: the button appears to do nothing.
   *
   * The neighbour is taken from the CURRENT page only. Moving the last row on a page
   * up would swap it with the last row of the previous page, whose order this client
   * never loaded, so the up button is disabled on the first row of the first page and
   * the down button on the last row of the last.
   */
  const reorderMutation = useMutation({
    // Returns a SENTINEL when there is nothing to do, so `onSuccess` can tell a real
    // move from a no-op.
    //
    // Returning `undefined` did not work: react-query treats a resolved `undefined`
    // as success and calls `onSuccess` regardless, so the early `if (!updates.length)
    // return` still toasted "FAQ moved up" for a move that never happened. That is
    // unreachable today because both buttons disable at the page boundaries - but it
    // is a landmine for whoever changes a boundary, and it would report a no-op as a
    // success. The sentinel is deliberately impossible to confuse with a real result.
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const updates = swapOrderUpdates(faqs, index, direction);
      // Nothing to do - the neighbour is off this page. Skip the request rather
      // than send a no-op and report it as a success.
      if (!updates.length) return REORDER_NOOP;
      return faqService.bulkUpdateOrders(updates);
    },
    onSuccess: (result, variables) => {
      // Silent on a no-op: nothing moved, so there is nothing to confirm. `undefined`
      // is deliberately NOT the sentinel - see the note on REORDER_NOOP.
      if (isReorderNoop(result, REORDER_NOOP)) return;
      // Otherwise silent-but-wrong. A reorder has no visible effect until the list
      // refetches, so without this the admin clicks the button and cannot tell it
      // worked - indistinguishable from the tie bug the swap guard prevents.
      toast.success(
        variables.direction === -1 ? 'FAQ moved up' : 'FAQ moved down'
      );
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
      // From the COLLECTION's highest order, not from the visible page.
      //
      // `faqs` is 25 rows. Reading the max off it meant every newly imported FAQ was
      // created at the same order as the largest row on page 1 - colliding with it,
      // and with each other. With 717 migrated rows whose `order` values are
      // whatever the import produced, that is not a corner case.
      //
      // `maxOrderQuery` asks the server for exactly the highest-ordered row
      // (limit 1, descending), so the answer is global regardless of filters or
      // pagination. Falls back to the visible rows if that query has not landed,
      // which is still better than 0 and never worse than the old behaviour.
      order: nextFaqOrder(
        maxOrderQuery.data?.data?.[0]?.order ??
          (faqs.length > 0
            ? Math.max(...faqs.map((f) => f.order))
            : undefined)
      ),
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
                          {/* Tooltip says "Remove" to match the soft delete: a tooltip promising "Delete"
                          while the action only deactivates is the kind of small lie
                          that makes an admin distrust the rest of the row. */}
                          <Tooltip title="Remove from storefront">
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

      {/* Says "removed", not "deleted": this is a soft delete, so the wording has to match
          what actually happened or an admin will not know the FAQ is recoverable. */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Confirm Remove</DialogTitle>
        <DialogContent>
          <Typography>
            Remove “{deleteTarget?.question}” from the storefront? It stays in the
            database and can be reactivated by editing it later.
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
            {deleteMutation.isPending ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}