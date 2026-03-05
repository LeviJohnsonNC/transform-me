import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
      getSession: (...args: any[]) => mockGetSession(...args),
      getUser: (...args: any[]) => mockGetUser(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
    },
  },
}));

// Mock use-toast so we can inspect calls without rendering a DOM
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const noopUnsubscribe = { data: { subscription: { unsubscribe: vi.fn() } } };

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no existing session, auth state change listener fires immediately
  mockGetSession.mockResolvedValue({ data: { session: null } });
  mockOnAuthStateChange.mockReturnValue(noopUnsubscribe);
});

describe('useAuth', () => {
  describe('initial state', () => {
    it('starts with loading = true and no user', async () => {
      const { result } = renderHook(() => useAuth());
      // Initially loading before async session fetch resolves
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('sets loading to false after session check resolves', async () => {
      const { result } = renderHook(() => useAuth());
      // Wait for effects to settle
      await act(async () => {});
      expect(result.current.loading).toBe(false);
    });

    it('unsubscribes from auth state changes on unmount', () => {
      const unsubscribeSpy = vi.fn();
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeSpy } },
      });
      const { unmount } = renderHook(() => useAuth());
      unmount();
      expect(unsubscribeSpy).toHaveBeenCalledOnce();
    });
  });

  describe('signIn', () => {
    it('calls supabase.auth.signInWithPassword with provided credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('user@example.com', 'password123');
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });

    it('shows a success toast and returns no error on success', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn('user@example.com', 'password123');
      });

      expect(returnValue.error).toBeNull();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Welcome back!' })
      );
    });

    it('shows a destructive toast and returns error on Supabase error', async () => {
      const supabaseError = new Error('Invalid credentials');
      mockSignInWithPassword.mockResolvedValue({ error: supabaseError });
      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn('bad@example.com', 'wrong');
      });

      expect(returnValue.error).toBe(supabaseError);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Sign in failed', variant: 'destructive' })
      );
    });

    it('shows a generic destructive toast when an unexpected exception is thrown', async () => {
      mockSignInWithPassword.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn('user@example.com', 'password123');
      });

      expect(returnValue.error).toBeTruthy();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Sign in failed', variant: 'destructive' })
      );
    });

    it('resets loading to false after completion', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('user@example.com', 'password123');
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('calls supabase.auth.signUp with email and emailRedirectTo', async () => {
      mockSignUp.mockResolvedValue({ error: null });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp('new@example.com', 'password123');
      });

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          password: 'password123',
          options: expect.objectContaining({ emailRedirectTo: expect.stringContaining('/') }),
        })
      );
    });

    it('shows a verification email toast on success', async () => {
      mockSignUp.mockResolvedValue({ error: null });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp('new@example.com', 'password123');
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Account created!' })
      );
    });

    it('shows destructive toast and returns error on failure', async () => {
      const supabaseError = new Error('Email already taken');
      mockSignUp.mockResolvedValue({ error: supabaseError });
      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp('taken@example.com', 'password123');
      });

      expect(returnValue.error).toBe(supabaseError);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Sign up failed', variant: 'destructive' })
      );
    });
  });

  describe('signOut', () => {
    it('calls supabase.auth.signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalledOnce();
    });

    it('shows a signed-out toast on success', async () => {
      mockSignOut.mockResolvedValue({ error: null });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Signed out' })
      );
    });

    it('shows destructive toast and returns error on failure', async () => {
      const supabaseError = new Error('Network error');
      mockSignOut.mockResolvedValue({ error: supabaseError });
      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signOut();
      });

      expect(returnValue.error).toBe(supabaseError);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Sign out failed', variant: 'destructive' })
      );
    });
  });
});
