import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { ENDPOINTS } from '@/api/config/endpoints';

// API functions using your configured endpoints
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await fetch(ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    return response.json();
  },

  register: async (userData: {
    email: string;
    password: string;
    name: string;
  }) => {
    const response = await fetch(ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }

    return response.json();
  },

  getProfile: async (token: string) => {
    const response = await fetch(ENDPOINTS.AUTH.PROFILE, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  },
};

export const useLogin = () => {
  const { login, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: authAPI.login,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (body) => {
      // The API answers { success, data: { token, name, email, role } } - flat,
      // with no nested `user` object.
      //
      // This used to read `data.data.user`, which is undefined, so the store was
      // handed `user: undefined` and no screen could ever know the logged-in role.
      // That is why the nav could not be filtered by role at all - there was
      // nothing to filter on. Build the user from what the API actually returns.
      const d = body?.data ?? {};
      const token = d.token ?? '';

      if (token) {
        localStorage.setItem('auth-token', token);
      }

      login(
        {
          // The login response carries no id, so the email stands in as one.
          id: d.id ?? d.email ?? '',
          email: d.email ?? '',
          name: d.name ?? '',
          role: d.role,
        },
        token
      );
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useRegister = () => {
  const setLoading = useAuthStore((state) => state.setLoading);

  return useMutation({
    mutationFn: authAPI.register,
    onMutate: () => {
      setLoading(true);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

// Updated logout - no API call, just clear local data
export const useLogout = () => {
  const { logout, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // No API call needed, just return a resolved promise
      return Promise.resolve();
    },
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      // Clear token from localStorage
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token'); // Remove this too if you have it

      // Clear auth storage (the persisted zustand data)
      localStorage.removeItem('auth-storage');

      // Update auth store
      logout();

      // Clear all cached data
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Still clear everything even on error
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      localStorage.removeItem('auth-storage');
      logout();
      queryClient.clear();
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useProfile = () => {
  const { token, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authAPI.getProfile(token!),
    enabled: isAuthenticated && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
