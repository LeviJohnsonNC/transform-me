// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const Boom = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs the caught error itself; silence it so a passing run is quiet.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders its children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('all fine')).toBeDefined();
  });

  it('shows a real screen instead of unmounting to a blank one', () => {
    render(
      <ErrorBoundary>
        <Boom message="kaboom" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('SOMETHING BROKE')).toBeDefined();
    expect(screen.getByRole('button', { name: /reload/i })).toBeDefined();
  });

  it("shows the error's message, so the failure is reportable", () => {
    render(
      <ErrorBoundary>
        <Boom message="Cannot read properties of undefined (reading id)" />
      </ErrorBoundary>,
    );
    // getAllBy: a regex matches ancestors' textContent as well as the leaf.
    expect(screen.getAllByText(/Cannot read properties of undefined/).length).toBeGreaterThan(0);
  });

  it('says the data is safe, because a render fault is not a lost save', () => {
    render(
      <ErrorBoundary>
        <Boom message="x" />
      </ErrorBoundary>,
    );
    expect(screen.getAllByText(/Your data is safe/).length).toBeGreaterThan(0);
  });

  it('logs the error rather than swallowing it', () => {
    render(
      <ErrorBoundary>
        <Boom message="logged please" />
      </ErrorBoundary>,
    );
    const logged = (console.error as ReturnType<typeof vi.fn>).mock.calls
      .flat()
      .some((arg) => arg instanceof Error && arg.message === 'logged please');
    expect(logged).toBe(true);
  });
});
