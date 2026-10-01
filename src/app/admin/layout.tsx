'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLogout } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import GlobalSearchModal from '@/components/GlobalSearchModal';
import { canSeePath, resolveRole } from '@/utils/navVisibility';
import { Toaster, toast } from 'react-hot-toast';
import NotificationDropdown from '@/components/NotificationDropdown';

// Define types for our sidebar items with nested dropdowns
interface NestedDropdownOption {
  text: string;
  path: string;
}

interface DropdownOption {
  text: string;
  path: string;
  hasNestedDropdown?: boolean;
  nestedOptions?: NestedDropdownOption[];
}

interface SidebarItem {
  text: string;
  icon: string;
  path?: string;
  hasDropdown?: boolean;
  options?: DropdownOption[];
  isLogout?: boolean; // Add this to identify logout item
}

// Define dropdown state type with nested dropdowns
interface DropdownState {
  [key: string]: boolean;
}

interface NestedDropdownState {
  [key: string]: boolean;
}

const sidebarItems: SidebarItem[] = [
  { text: 'Dashboard', icon: '/dashbord (2).png', path: '/admin/dashboard' },

  {
    text: 'Inventory',
    icon: '/inventory.png',
    hasDropdown: true,
    options: [
      { text: 'Add Product', path: '/admin/inventory/add-product' },
      { text: 'Delete Product/Category', path: '/admin/inventory/delete' },
      { text: 'Update Product', path: '/admin/inventory/update' },
      { text: 'View All Products', path: '/admin/inventory/view' },
    ],
  },
  {
    text: 'Payments',
    icon: '/order.png',
    hasDropdown: true,
    options: [
      { text: 'Payments', path: '/admin/payments/payment' },
      { text: 'Refunds', path: '/admin/payments/refund' },
    ],
  },
  {
    text: 'Orders',
    icon: '/order.png',
    hasDropdown: true,
    options: [
      { text: 'Orders', path: '/admin/order/orders' },
      { text: 'RFQs', path: '/admin/order/rfq' },
    ],
  },
  {
    text: 'Logistics',
    icon: '/logistics.png',
    hasDropdown: true,
    options: [
      // "Payment Management" was removed from this menu. It pointed at
      // /admin/logistics/payment-management, which was a second, independent copy
      // of /admin/payments - the same screens, a second time in the nav, and
      // originally with its own hardcoded mock payments. Payments and Refunds now
      // live only under "Payments" in the menu above.
      {
        text: 'Warehouse',
        path: '/admin/logistics/warehouse',
        hasNestedDropdown: true,
        nestedOptions: [
          {
            text: 'Add Stock',
            path: '/admin/logistics/warehouse/add-stock',
          },
          {
            text: 'Delete Stock',
            path: '/admin/logistics/warehouse/delete-product',
          },
          {
            text: 'Update Stock',
            path: '/admin/logistics/warehouse/update-product',
          },
          {
            text: 'View Stock',
            path: '/admin/logistics/warehouse/view-products',
          },
        ],
      },
      { text: 'Purchase Orders', path: '/admin/logistics/orders' },
      { text: 'Document Tracking', path: '/admin/logistics/document-tracking' },
    ],
  },
  {
    text: 'Management',
    icon: '/inventory.png',
    hasDropdown: true,
    options: [
      { text: 'Products Listing', path: '/admin/data-management/products' },
      { text: 'Categories Listing', path: '/admin/data-management/categories' },
      { text: 'Warehouse Listing', path: '/admin/data-management/warehouses' },
      { text: 'Suppliers Listing', path: '/admin/data-management/suppliers' },
    ],
  },
  {
    text: 'Customers',
    icon: '/customers.png',
    hasDropdown: true,
    options: [
      { text: 'Customers Listing', path: '/admin/data-management/customers' },
    ],
  },
  {
    text: 'Employees',
    icon: '/user.png',
    hasDropdown: true,
    options: [
      { text: 'Employees Listing', path: '/admin/data-management/employees' },
    ],
  },
  // { text: 'Sales Report', icon: '/sales-report.png', path: '/admin/sales' },
  { text: 'Messages', icon: '/customers.png', path: '/admin/messages' },
  // { text: 'Settings', icon: '/settings.png', path: '/admin/settings' },
  { text: 'Sign Out', icon: '/sign-out.png', isLogout: true }, // Mark as logout item
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Auth hooks
  const { user, isAuthenticated, token } = useAuthStore();

  // Store first, token second - see resolveRole for why.
  const role = useMemo(
    () => resolveRole(user?.role, token ?? undefined),
    [user?.role, token]
  );

  /**
   * The nav filtered to what this role may use.
   *
   * Hiding a menu item is presentation, not enforcement - the API decides. This
   * mirrors the server's permission table (src/utils/permissions.ts) so the menu
   * never offers something that will 403, and never hides something that would
   * have worked.
   *
   * Filtering recurses into dropdowns, and a section left with no visible children
   * is dropped entirely rather than showing an empty heading.
   */
  const visibleSidebarItems = useMemo<SidebarItem[]>(() => {

    // Recurses into nestedOptions as well as options. Logistics > Warehouse is a
    // NESTED dropdown holding Add/Delete/Update/View Stock, so filtering only the
    // first level hid Delete Product/Category correctly while leaving Delete Stock
    // visible to STAFF - a test caught that, and typing the URL would have hit a
    // 403 the menu had promised was not there.
    const filterNested = (options?: NestedDropdownOption[]): NestedDropdownOption[] | undefined =>
      options?.filter((o) => !o.path || canSeePath(role, o.path));

    const filterOptions = (options?: DropdownOption[]): DropdownOption[] => {
      if (!options) return [];
      return options
        .filter((o) => !o.path || canSeePath(role, o.path))
        .map((o) => {
          const nested = filterNested(o.nestedOptions);
          return nested ? { ...o, nestedOptions: nested } : o;
        })
        // A nested parent whose children were all filtered away has nothing left
        // to expand, so drop it rather than showing an inert header.
        .filter((o) => !o.nestedOptions || o.nestedOptions.length > 0);
    };

    const out: SidebarItem[] = [];
    for (const item of sidebarItems) {
      if (item.isLogout) {
        out.push(item);
        continue;
      }
      // A top-level item gated by path.
      if (item.path && !canSeePath(role, item.path)) continue;

      if (item.hasDropdown && item.options) {
        const options = filterOptions(item.options);
        if (!options.length) continue; // nothing left to show
        out.push({ ...item, options });
        continue;
      }
      out.push(item);
    }
    return out;
  }, [role]);
  const logoutMutation = useLogout();

  // Add mounted state to prevent hydration issues
  const [mounted, setMounted] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<HTMLElement | null>(null);

  // Create separate state for each dropdown
  const [openDropdowns, setOpenDropdowns] = useState<DropdownState>({
    Management: false,
    Inventory: false,
    Orders: false,
    Payments: false,
    Logistics: false,
    Customers: false,
    Employees: false,
  });

  // State for nested dropdowns
  const [openNestedDropdowns, setOpenNestedDropdowns] =
    useState<NestedDropdownState>({
      Warehouse: false,
    });

  // Add this function near your other utility functions
  const safeNavigate = (path: string) => {
    try {
      router.push(path);
    } catch (error) {
      console.error(`Navigation error to ${path}:`, error);
      // Optionally show a toast or notification to the user
    }
  };

  // Updated logout handler
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setShowLogoutDialog(false);

      // Force a hard redirect to prevent any auth checks from interfering
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if there's an error
      setShowLogoutDialog(false);
      window.location.href = '/login';
    }
  };

  // Notification handlers
  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  // Check authentication on mount and redirect if not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      window.location.href = '/login';
      return;
    }
  }, [mounted, isAuthenticated]);

  /**
   * Route guard: a page this role may not use never renders.
   *
   * Hiding the nav item is presentation only - anyone can type the URL, and the
   * page shell would load before the API returned 403. This closes that gap, so a
   * gated page redirects to the dashboard and says why.
   *
   * The API remains the real authority: it re-checks every call against the live
   * role. This exists so a blocked user gets a clear message instead of a page of
   * broken panels, and so the UI never claims access it does not have.
   *
   * Fails CLOSED: if the role cannot be determined, the gated page is refused. A
   * guard that assumed access when it could not tell would be worse than none.
   */
  const [blockedPath, setBlockedPath] = useState<string | null>(null);
  useEffect(() => {
    if (!mounted) return;
    // Wait until the persisted store has rehydrated, otherwise a refresh would
    // read an empty user and bounce a legitimate admin off the page.
    if (!isAuthenticated) return;

    if (canSeePath(role, pathname)) {
      setBlockedPath(null);
      return;
    }

    // Only redirect on an actual change of page, not on the first render of a
    // route the user was already on when their session loaded.
    setBlockedPath(pathname);
    router.replace('/admin/dashboard');
  }, [mounted, isAuthenticated, role, pathname, router]);

  // Explain after the redirect, so the message is not thrown away with the page.
  useEffect(() => {
    if (!blockedPath) return;
    toast.error('You do not have access to that page.');
    setBlockedPath(null);
  }, [blockedPath]);

  // Handle item click (including logout)
  const handleItemClick = (item: SidebarItem) => {
    if (item.isLogout) {
      setShowLogoutDialog(true);
    } else if (item.path) {
      safeNavigate(item.path);
    }
  };

  // Only execute client-side
  useEffect(() => {
    setMounted(true);

    // Set Dashboard as the default route on initial load
    if (pathname === '/admin' || pathname === '/admin/') {
      safeNavigate('/admin/dashboard');
    }

    // Auto open appropriate dropdown based on current path
    if (pathname.startsWith('/admin/data-management/')) {
      setOpenDropdowns((prev) => ({ ...prev, Management: true }));
    } else if (pathname.startsWith('/admin/inventory/')) {
      setOpenDropdowns((prev) => ({ ...prev, Inventory: true }));
    } else if (pathname.startsWith('/admin/orders')) {
      setOpenDropdowns((prev) => ({ ...prev, Orders: true }));
    } else if (pathname.startsWith('/admin/payments/')) {
      setOpenDropdowns((prev) => ({ ...prev, Payments: true }));
    } else if (pathname.startsWith('/admin/logistics/')) {
      setOpenDropdowns((prev) => ({ ...prev, Logistics: true }));

      // Auto open nested dropdown if on a nested path
      if (pathname.startsWith('/admin/logistics/warehouse/')) {
        setOpenNestedDropdowns((prev) => ({ ...prev, Warehouse: true }));
      }
    }
  }, [pathname, router]);

  // Keyboard shortcut for global search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setShowGlobalSearch(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDropdown = (dropdownName: string) => {
    // Close all other dropdowns when opening a new one
    const newDropdownState = Object.keys(openDropdowns).reduce<DropdownState>(
      (acc, key) => ({
        ...acc,
        [key]: key === dropdownName ? !openDropdowns[dropdownName] : false,
      }),
      {} as DropdownState
    );
    setOpenDropdowns(newDropdownState);

    // Reset nested dropdowns when closing parent or switching to different parent
    if (openDropdowns[dropdownName] || dropdownName !== 'Logistics') {
      setOpenNestedDropdowns({
        Warehouse: false,
      });
    }
  };

  const toggleNestedDropdown = (
    e: React.MouseEvent,
    nestedDropdownName: string
  ) => {
    e.stopPropagation(); // Prevent parent dropdown from closing
    setOpenNestedDropdowns((prev) => ({
      ...prev,
      [nestedDropdownName]: !prev[nestedDropdownName],
    }));
  };

  // Function to determine if an item or its options are active
  const isItemActive = (item: SidebarItem): boolean => {
    if (!mounted) return false;

    if (item.hasDropdown) {
      if (item.text === 'Management') {
        return pathname.startsWith('/admin/data-management');
      } else if (item.text === 'Inventory') {
        return pathname.startsWith('/admin/inventory');
      } else if (item.text === 'Orders') {
        return pathname.startsWith('/admin/orders');
      } else if (item.text === 'Logistics') {
        return pathname.startsWith('/admin/logistics');
      } else if (item.text === 'Payments') {
        return pathname.startsWith('/admin/payments');
      }
      return false;
    }
    return pathname === item.path;
  };

  // Check if dropdown is open
  const isDropdownOpen = (itemText: string): boolean => {
    if (!mounted) return false;
    return openDropdowns[itemText] || false;
  };

  // Check if nested dropdown is open
  const isNestedDropdownOpen = (itemText: string): boolean => {
    if (!mounted) return false;
    return openNestedDropdowns[itemText] || false;
  };

  // Check if a nested option is active
  const isNestedOptionActive = (path: string): boolean => {
    if (!mounted) return false;
    return pathname === path;
  };

  // Show loading state during hydration to prevent mismatch
  if (!mounted) {
    return (
      <div style={{ display: 'flex' }}>
        <div
          style={{ width: 240, height: '100vh', backgroundColor: '#f5f5f5' }}
        />
        <div
          style={{
            flexGrow: 1,
            padding: 24,
            marginTop: 64,
            backgroundColor: '#F9FAFB',
            minHeight: '85vh',
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <Box sx={{ display: 'flex' }} suppressHydrationWarning={true}>
      <CssBaseline />
      {/* Navbar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#fff',
          color: '#333',
        }}
      >
        <Toolbar>
          <div style={{ position: 'relative', width: '130px', height: '65px' }}>
            <Image
              src="/Logo.png"
              alt="EZRM Logo"
              fill
              priority={true}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <Box
            sx={{
              width: '80vw',
              mr: 5,
              ml: 10,
              height: '39px',
              borderRadius: '13px',
              backgroundColor: '#F9FAFB',
              display: 'flex',
              alignItems: 'center',
              pl: 2,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            }}
            onClick={() => setShowGlobalSearch(true)}
          >
            <Image src="/magnifier.svg" alt="Search" width={20} height={20} />
            <Typography variant="body2" sx={{ ml: 1, color: '#666' }}>
              Search Here...
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                height: '39px',
                width: '39px',
                backgroundColor: '#FFFAF1',
                borderRadius: '13px',
                mr: 2,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                },
              }}
              onClick={handleNotificationClick}
            >
              <Image
                src="/notification.png"
                alt="Notifications"
                width={21}
                height={21}
              />
            </Box>
            <Image
              src="/photo.jpg"
              alt="User"
              width={43}
              height={43}
              style={{ borderRadius: '12px', objectFit: 'cover' }}
            />
            <Typography variant="body2" sx={{ ml: 1 }}>
              <b>{user?.name || 'Admin'}</b> <br />
              Admin
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: 240,
            boxSizing: 'border-box',
            borderRight: 'none',
            overflowY: 'auto',
            // Hide scrollbar for webkit browsers
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            // Hide scrollbar for Firefox
            scrollbarWidth: 'none',
            // Hide scrollbar for IE
            msOverflowStyle: 'none',
          },
        }}
      >
        <Toolbar />
        <Box
          sx={{
            overflow: 'auto',
            // Hide scrollbar for webkit browsers
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            // Hide scrollbar for Firefox
            scrollbarWidth: 'none',
            // Hide scrollbar for IE
            msOverflowStyle: 'none',
          }}
        >
          <List>
            {visibleSidebarItems.map((item) => (
              <React.Fragment key={item.text}>
                {item.hasDropdown ? (
                  <>
                    <ListItemButton
                      onClick={() => toggleDropdown(item.text)}
                      selected={isItemActive(item)}
                      sx={{
                        mr: 3,
                        ml: 3,
                        mt: 0.5,
                        mb: 0.5,
                        color: isItemActive(item)
                          ? '#fff'
                          : 'rgba(115, 119, 145, 1)',
                        borderRadius: '16px',
                        border: isDropdownOpen(item.text)
                          ? '2px solid #f9a922'
                          : 'none',
                        '&:hover': {
                          backgroundColor: isItemActive(item)
                            ? '#f9a922'
                            : '#f9a922',
                          color: '#fff',
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#f9a922',
                          color: '#fff',
                          '&:hover': {
                            backgroundColor: '#f9a922',
                          },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}>
                        <Image
                          src={item.icon || '/placeholder.svg'}
                          alt={`${item.text} Icon`}
                          width={24}
                          height={24}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        sx={{ color: 'inherit' }}
                      />
                      <Image
                        src={'/down.png'}
                        alt="Toggle Icon"
                        width={12}
                        height={8}
                        style={{
                          transition: 'transform 0.3s',
                          transform: isDropdownOpen(item.text)
                            ? 'rotate(0deg)'
                            : 'rotate(180deg)',
                        }}
                      />
                    </ListItemButton>
                    {isDropdownOpen(item.text) && item.options && (
                      <Box
                        sx={{
                          ml: 1,
                          mt: 0,
                          mb: 0.5,
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        {item.options.map((option) => {
                          const isActive = pathname === option.path;
                          const hasNestedDropdown =
                            option.hasNestedDropdown && option.nestedOptions;

                          return (
                            <React.Fragment key={option.text}>
                              <ListItemButton
                                onClick={(e) => {
                                  if (hasNestedDropdown) {
                                    toggleNestedDropdown(e, option.text);
                                  } else {
                                    safeNavigate(option.path);
                                  }
                                }}
                                selected={isActive}
                                sx={{
                                  color: isActive ? '#fff' : '#333',
                                  fontFamily: 'Poppins, sans-serif',
                                  '&:hover': {
                                    backgroundColor: isActive
                                      ? '#f9a922'
                                      : '#f9a922',
                                    color: '#fff',
                                  },
                                  py: 0.25,
                                  mt: 0.25,
                                  textAlign: 'center',
                                  width: '200px',
                                  minWidth: '180px',
                                  maxWidth: '180px',
                                  borderRadius:
                                    hasNestedDropdown &&
                                    isNestedDropdownOpen(option.text)
                                      ? '20px 20px 0 0'
                                      : '20px',
                                  '&.Mui-selected': {
                                    backgroundColor: '#f9a922',
                                    color: '#fff',
                                    '&:hover': {
                                      backgroundColor: '#f9a922',
                                    },
                                  },
                                }}
                              >
                                <ListItemText
                                  primary={option.text}
                                  primaryTypographyProps={{
                                    sx: {
                                      fontSize: '11px',
                                      color: 'inherit',
                                      fontFamily: 'Poppins, sans-serif',
                                    },
                                  }}
                                />
                                {hasNestedDropdown && (
                                  <Image
                                    src={'/down.png'}
                                    alt="Toggle Icon"
                                    width={8}
                                    height={6}
                                    style={{
                                      transition: 'transform 0.3s',
                                      transform: isNestedDropdownOpen(
                                        option.text
                                      )
                                        ? 'rotate(0deg)'
                                        : 'rotate(180deg)',
                                    }}
                                  />
                                )}
                              </ListItemButton>

                              {/* Nested Dropdown Options */}
                              {hasNestedDropdown &&
                                isNestedDropdownOpen(option.text) &&
                                option.nestedOptions && (
                                  <Box
                                    sx={{
                                      mt: 0,
                                      mb: 0.25,
                                      display: 'grid',
                                      placeItems: 'center',
                                    }}
                                  >
                                    {option.nestedOptions.map(
                                      (nestedOption) => {
                                        const isNestedActive =
                                          isNestedOptionActive(
                                            nestedOption.path
                                          );

                                        return (
                                          <ListItemButton
                                            key={nestedOption.text}
                                            onClick={() => {
                                              safeNavigate(nestedOption.path);
                                            }}
                                            selected={isNestedActive}
                                            sx={{
                                              color: isNestedActive
                                                ? '#fff'
                                                : '#333',
                                              fontFamily: 'Poppins, sans-serif',
                                              '&:hover': {
                                                backgroundColor: isNestedActive
                                                  ? '#f9a922'
                                                  : '#f9a922',
                                                color: '#fff',
                                              },
                                              py: 0.1,
                                              mt: 0.1,
                                              textAlign: 'center',
                                              width: '160px',
                                              minWidth: '160px',
                                              maxWidth: '160px',
                                              borderRadius: '16px',
                                              fontSize: '10px',
                                              '&.Mui-selected': {
                                                backgroundColor: '#f9a922',
                                                color: '#fff',
                                                '&:hover': {
                                                  backgroundColor: '#f9a922',
                                                },
                                              },
                                            }}
                                          >
                                            <ListItemText
                                              primary={nestedOption.text}
                                              primaryTypographyProps={{
                                                sx: {
                                                  fontSize: '8px',
                                                  color: 'inherit',
                                                  fontFamily:
                                                    'Poppins, sans-serif',
                                                  mt: 0.5,
                                                  mb: 0.5,
                                                },
                                              }}
                                            />
                                          </ListItemButton>
                                        );
                                      }
                                    )}
                                  </Box>
                                )}
                            </React.Fragment>
                          );
                        })}
                      </Box>
                    )}
                  </>
                ) : (
                  <ListItemButton
                    onClick={() => handleItemClick(item)}
                    selected={pathname === item.path}
                    sx={{
                      mr: 3,
                      ml: 3,
                      mt: 0.5,
                      mb: 0.5,
                      backgroundColor:
                        pathname === item.path ? '#f9a922' : 'transparent',
                      color:
                        pathname === item.path
                          ? '#fff'
                          : 'rgba(115, 119, 145, 1)',
                      borderRadius: '16px',
                      '&:hover': {
                        backgroundColor:
                          pathname === item.path ? '#f9a922' : '#f9a922',
                        color: '#fff',
                      },
                      '&.Mui-selected': {
                        backgroundColor: '#f9a922',
                        color: '#fff',
                        borderRadius: '16px',
                        '&:hover': {
                          backgroundColor: '#f9a922',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}>
                      <Image
                        src={item.icon || '/placeholder.svg'}
                        alt={`${item.text} Icon`}
                        width={24}
                        height={24}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        color: 'inherit',
                      }}
                    />
                  </ListItemButton>
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to sign out?</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowLogoutDialog(false)}
            disabled={logoutMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogout}
            color="error"
            variant="contained"
            disabled={logoutMutation.isPending}
            startIcon={
              logoutMutation.isPending ? <CircularProgress size={16} /> : null
            }
          >
            {logoutMutation.isPending ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Search Modal */}
      <GlobalSearchModal
        open={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />

      {/* Notification Dropdown */}
      <NotificationDropdown
        anchorEl={notificationAnchorEl}
        onClose={handleNotificationClose}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          backgroundColor: '#F9FAFB',
          minHeight: '85vh',
        }}
      >
        {children}
      </Box>

      {/* Mounted here because react-hot-toast needs a single Toaster in the tree,
          and there was none anywhere in the admin - so every toast the admin
          raised (supplier created, location filled, and now the route guard) was
          being created and never shown. */}
      <Toaster position="top-center" />
    </Box>
  );
}
