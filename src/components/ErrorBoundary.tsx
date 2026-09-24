import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a render-time throw so the app shows something instead of a blank
 * screen. Before this, any error in a page component unmounted the whole tree
 * and left a black rectangle with no way to tell what happened — which is what
 * an unreproducible "the app went dead" report looks like from the outside.
 *
 * Has to be a class: there is no hook equivalent of componentDidCatch.
 *
 * It does NOT catch errors thrown in event handlers or in async code — React
 * boundaries never have. Failed saves surface as toasts instead.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Left as console output on purpose: there is no error reporting service
    // wired up, and swallowing it entirely would be worse than a log the
    // browser console keeps.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="surface rounded-[3px] edge-rule w-full max-w-md p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-magenta shrink-0" />
            <span className="font-display text-[10px] tracking-[0.2em] text-magenta">
              SOMETHING BROKE
            </span>
          </div>

          <h1 className="font-display font-bold text-[21px] leading-[1.15] mt-3">
            The app hit an error it could not recover from
          </h1>
          <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
            Your data is safe — this is a display fault, not a save. Reloading usually clears it.
          </p>

          {/* The message itself, because "something went wrong" with no detail
              is not reportable. */}
          <pre className="surface-sunken rounded-[3px] mt-4 p-3 text-[11px] text-faint whitespace-pre-wrap break-words max-h-40 overflow-auto">
            {error.message || String(error)}
          </pre>

          <button
            type="button"
            onClick={this.handleReload}
            className="w-full h-11 mt-4 rounded-[3px] font-display font-bold tracking-[0.12em] bg-cyan text-[#06121A] hover:bg-cyan-soft flex items-center justify-center gap-2"
          >
            <RotateCw size={16} />
            RELOAD
          </button>
        </div>
      </div>
    );
  }
}
