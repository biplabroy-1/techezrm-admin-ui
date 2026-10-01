'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrdersIcon,
  LocalShipping as LogisticsIcon,
  Payment as PaymentIcon,
  Category as CategoryIcon,
  Warehouse as WarehouseIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Message as MessageIcon,
  // HelpOutline for FAQs and VerifiedUser for certifications: reusing CategoryIcon
  // for all three would make the three entries indistinguishable in the results
  // list, which is the one thing this modal is for.
  HelpOutline as HelpOutlineIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface SearchSuggestion {
  id: string;
  title: string;
  description: string;
  path: string;
  category:
    | 'dashboard'
    | 'inventory'
    | 'orders'
    | 'logistics'
    | 'payments'
    | 'management'
    | 'settings'
    | 'messages';
  icon: React.ReactNode;
  keywords: string[];
}

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

const searchSuggestions: SearchSuggestion[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'View system overview and analytics',
    path: '/admin/dashboard',
    category: 'dashboard',
    icon: <DashboardIcon />,
    keywords: ['dashboard', 'overview', 'analytics', 'home', 'main'],
  },
  {
    id: 'products',
    title: 'Products Listing',
    description: 'Manage products and inventory items',
    path: '/admin/data-management/products',
    category: 'inventory',
    icon: <InventoryIcon />,
    keywords: ['products', 'inventory', 'items', 'goods', 'stock'],
  },
  {
    id: 'categories',
    title: 'Categories Listing',
    description: 'Manage product categories',
    path: '/admin/data-management/categories',
    category: 'management',
    icon: <CategoryIcon />,
    keywords: ['categories', 'category', 'classification', 'groups'],
  },
  {
    id: 'faqs',
    title: 'FAQs',
    description: 'Manage storefront and product FAQs',
    path: '/admin/data-management/faqs',
    category: 'management',
    icon: <HelpOutlineIcon />,
    // "question" and "answer" because those are what an admin searching for this
    // screen will type - searching "faq" alone is less likely than searching the
    // field being edited.
    keywords: ['faq', 'faqs', 'questions', 'answers', 'help', 'support'],
  },
  {
    id: 'certification-types',
    title: 'Certification Types',
    description: 'Manage certification kinds and their PDFs',
    path: '/admin/data-management/certifications',
    category: 'management',
    icon: <VerifiedUserIcon />,
    keywords: [
      'certification',
      'certifications',
      'certifications type',
      'fssai',
      'iso',
      'kosher',
      'halal',
    ],
  },
  {
    id: 'warehouses',
    title: 'Warehouse Listing',
    description: 'Manage warehouse locations',
    path: '/admin/data-management/warehouses',
    category: 'logistics',
    icon: <WarehouseIcon />,
    keywords: ['warehouse', 'warehouses', 'storage', 'location', 'facility'],
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    description: 'View and manage inventory levels',
    path: '/admin/inventory/view',
    category: 'inventory',
    icon: <InventoryIcon />,
    keywords: ['inventory', 'stock', 'quantity', 'levels', 'management'],
  },
  {
    id: 'orders',
    title: 'Orders',
    description: 'View and manage customer orders',
    path: '/admin/order/orders',
    category: 'orders',
    icon: <OrdersIcon />,
    keywords: ['orders', 'order', 'customer', 'purchase', 'sales'],
  },
  {
    id: 'rfq',
    title: 'RFQs',
    description: 'Manage Request for Quotations',
    path: '/admin/order/rfq',
    category: 'orders',
    icon: <OrdersIcon />,
    keywords: ['rfq', 'quotation', 'request', 'quote'],
  },
  {
    id: 'logistics',
    title: 'Logistics',
    description: 'Manage shipping and delivery',
    path: '/admin/logistics/orders',
    category: 'logistics',
    icon: <LogisticsIcon />,
    keywords: ['logistics', 'shipping', 'delivery', 'transport', 'warehouse'],
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'Manage payment transactions',
    path: '/admin/payments/payment',
    category: 'payments',
    icon: <PaymentIcon />,
    keywords: ['payments', 'payment', 'transactions', 'money', 'billing'],
  },
  {
    id: 'refunds',
    title: 'Refunds',
    description: 'Process refund requests',
    path: '/admin/payments/refund',
    category: 'payments',
    icon: <PaymentIcon />,
    keywords: ['refunds', 'refund', 'return', 'money back'],
  },
  {
    id: 'messages',
    title: 'Messages',
    description: 'View customer messages and notifications',
    path: '/admin/messages',
    category: 'messages',
    icon: <MessageIcon />,
    keywords: ['messages', 'message', 'notifications', 'communication'],
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure system settings',
    path: '/admin/settings',
    category: 'settings',
    icon: <SettingsIcon />,
    keywords: ['settings', 'configuration', 'preferences', 'setup'],
  },
];

const categoryColors = {
  dashboard: '#1976d2',
  inventory: '#2e7d32',
  orders: '#ed6c02',
  logistics: '#9c27b0',
  payments: '#d32f2f',
  management: '#1565c0',
  settings: '#6c757d',
  messages: '#7b1fa2',
};

export default function GlobalSearchModal({
  open,
  onClose,
}: GlobalSearchModalProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    SearchSuggestion[]
  >([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFilteredSuggestions(searchSuggestions);
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSuggestions(searchSuggestions);
    } else {
      const filtered = searchSuggestions.filter(
        (suggestion) =>
          suggestion.keywords.some((keyword) =>
            keyword.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          suggestion.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setSelectedIndex(0);
    }
  }, [searchTerm]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredSuggestions[selectedIndex]) {
          handleSuggestionClick(filteredSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    router.push(suggestion.path);
    onClose();
    setSearchTerm('');
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
    setSelectedIndex(0);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              Global Search
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <TextField
            ref={inputRef}
            fullWidth
            placeholder="Search for products, orders, payments, settings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Box>

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredSuggestions.length > 0 ? (
            <List sx={{ p: 0 }}>
              {filteredSuggestions.map((suggestion, index) => (
                <React.Fragment key={suggestion.id}>
                  <ListItem sx={{ p: 0 }}>
                    <ListItemButton
                      selected={index === selectedIndex}
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        py: 2,
                        px: 3,
                        '&.Mui-selected': {
                          backgroundColor: '#f5f5f5',
                        },
                        '&:hover': {
                          backgroundColor: '#fafafa',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box
                          sx={{
                            color: categoryColors[suggestion.category],
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {suggestion.icon}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 500 }}
                            >
                              {suggestion.title}
                            </Typography>
                            <Chip
                              label={suggestion.category}
                              size="small"
                              sx={{
                                backgroundColor:
                                  categoryColors[suggestion.category],
                                color: 'white',
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {suggestion.description}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < filteredSuggestions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No results found for "{searchTerm}"
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try searching for different keywords
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            p: 2,
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#fafafa',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
