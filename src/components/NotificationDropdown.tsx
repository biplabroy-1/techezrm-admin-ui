'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/api/services/notifications';
import { toast } from 'react-toastify';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import CircleIcon from '@mui/icons-material/Circle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import RefreshIcon from '@mui/icons-material/Refresh';

interface NotificationDropdownProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'success':
      return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
    case 'warning':
      return <WarningIcon sx={{ color: '#ff9800' }} />;
    case 'error':
      return <ErrorIcon sx={{ color: '#f44336' }} />;
    case 'info':
      return <InfoIcon sx={{ color: '#2196f3' }} />;
    default:
      return <InfoIcon sx={{ color: '#2196f3' }} />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return '#f44336';
    case 'high':
      return '#ff9800';
    case 'medium':
      return '#2196f3';
    case 'low':
      return '#4caf50';
    default:
      return '#757575';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'refund':
      return '#4caf50';
    case 'inventory':
      return '#ff9800';
    case 'payment':
      return '#2196f3';
    case 'order':
      return '#9c27b0';
    case 'system':
      return '#607d8b';
    default:
      return '#757575';
  }
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationDropdown({
  anchorEl,
  onClose,
}: NotificationDropdownProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const open = Boolean(anchorEl);

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', { page }],
    queryFn: () => notificationService.getNotifications({ page, limit: 10 }),
    enabled: open,
  });
// Typed as number, not left to infer the literal 0. With the const untyped, `0` was
// narrowed to the literal type and `unreadCount !== 1` below became a comparison
// between two literals, which tsc rejects as having no overlap.
const unreadCountData: number = 0;
  // Fetch unread count
  // const { data: unreadCountData } = useQuery({
  //   queryKey: ['notifications-unread-count'],
  //   queryFn: () => notificationService.getUnreadCount(),
  //   refetchInterval: 30000, // Refetch every 30 seconds
  //   retry: false, // Don't retry on error to prevent console spam
  //   onError: (error) => {
  //     console.warn('Failed to fetch unread notifications count:', error);
  //   },
  // });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return notificationService.markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark notification as read');
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return notificationService.markAllAsRead();
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark all notifications as read');
    },
  });

  const notifications = notificationsData?.data?.notifications || [];
  const totalNotifications = notificationsData?.data?.total || 0;
  const unreadCount = unreadCountData || 0;

  const handleNotificationClick = (notification: any) => {
    if (notification.status === 'unread') {
      markAsReadMutation.mutate(notification._id);
    }

    // Handle navigation based on notification type
    if (notification.actionRequired?.actionUrl) {
      window.open(notification.actionRequired.actionUrl, '_blank');
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          width: 400,
          maxHeight: 600,
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e0e0e0',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#1F2A44',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Notifications
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={isLoading}
              sx={{ color: '#666' }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onClose} sx={{ color: '#666' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {unreadCount > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: '#666', fontFamily: 'Poppins, sans-serif' }}
            >
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Typography>
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              startIcon={<DoneAllIcon />}
              sx={{
                textTransform: 'none',
                color: '#1976d2',
                fontSize: '12px',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Mark all as read
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            Failed to load notifications
          </Alert>
        )}

        {!isLoading && !error && notifications.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
            <Typography
              variant="body2"
              sx={{ color: '#666', fontFamily: 'Poppins, sans-serif' }}
            >
              No notifications
            </Typography>
          </Box>
        )}

        {!isLoading && !error && notifications.length > 0 && (
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 2,
                    cursor: 'pointer',
                    backgroundColor:
                      notification.status === 'unread'
                        ? '#f8f9fa'
                        : 'transparent',
                    '&:hover': {
                      backgroundColor:
                        notification.status === 'unread'
                          ? '#e3f2fd'
                          : '#f5f5f5',
                    },
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box sx={{ position: 'relative' }}>
                      {getCategoryIcon(notification.category)}
                      {notification.status === 'unread' && (
                        <CircleIcon
                          sx={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            fontSize: 12,
                            color: '#1976d2',
                          }}
                        />
                      )}
                    </Box>
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight:
                              notification.status === 'unread' ? 600 : 500,
                            color: '#1F2A44',
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        >
                          {notification.title}
                        </Typography>
                        <Chip
                          label={notification.priority}
                          size="small"
                          sx={{
                            backgroundColor: getPriorityColor(
                              notification.priority
                            ),
                            color: 'white',
                            fontSize: '10px',
                            height: 20,
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        />
                        <Chip
                          label={notification.type}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: getTypeColor(notification.type),
                            color: getTypeColor(notification.type),
                            fontSize: '10px',
                            height: 20,
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#666',
                            mb: 1,
                            fontFamily: 'Poppins, sans-serif',
                            lineHeight: 1.4,
                          }}
                        >
                          {notification.message}
                        </Typography>

                        {notification.actionRequired && (
                          <Box sx={{ mb: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#1976d2',
                                fontWeight: 500,
                                fontFamily: 'Poppins, sans-serif',
                              }}
                            >
                              Action Required:{' '}
                              {notification.actionRequired.description}
                            </Typography>
                          </Box>
                        )}

                        {notification.metadata &&
                          Object.keys(notification.metadata).length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              {Object.entries(notification.metadata).map(
                                ([key, value]) => (
                                  <Typography
                                    key={key}
                                    variant="caption"
                                    sx={{
                                      color: '#666',
                                      fontFamily: 'Poppins, sans-serif',
                                      display: 'block',
                                    }}
                                  >
                                    {key}: {value}
                                  </Typography>
                                )
                              )}
                            </Box>
                          )}

                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <AccessTimeIcon
                            sx={{ fontSize: 12, color: '#999' }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#999',
                              fontFamily: 'Poppins, sans-serif',
                            }}
                          >
                            {formatTimeAgo(notification.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {totalNotifications > 10 && (
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => {
              // Navigate to full notifications page
              window.location.href = '/admin/notifications';
            }}
            sx={{
              textTransform: 'none',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            View All Notifications ({totalNotifications})
          </Button>
        </Box>
      )}
    </Popover>
  );
}
