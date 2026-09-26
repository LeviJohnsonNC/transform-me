import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Check, Copy, KeyRound, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiTokens, useCreateApiToken, useRevokeApiToken } from '@/hooks/useApiTokens';
import { apiBaseUrl } from '@/lib/apiTokens';

interface ApiAccessProps {
  onBack: () => void;
}

const CopyButton: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy — select the text and copy it by hand');
    }
  };
  return (
    <Button variant="ghost" size="sm" onClick={copy} aria-label={label}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </Button>
  );
};

export const ApiAccess: React.FC<ApiAccessProps> = ({ onBack }) => {
  const { data: tokens = [], isLoading } = useApiTokens();
  const createToken = useCreateApiToken();
  const revokeToken = useRevokeApiToken();
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      const key = await createToken.mutateAsync(name.trim() || 'Assistant');
      setNewKey(key);
      setName('');
    } catch (error) {
      toast.error('Could not create key', { description: (error as Error).message });
    }
  };

  const handleRevoke = async (id: string, tokenName: string) => {
    if (!window.confirm(`Revoke "${tokenName}"? Anything using it stops working immediately.`)) return;
    try {
      await revokeToken.mutateAsync(id);
    } catch (error) {
      toast.error('Could not revoke key', { description: (error as Error).message });
    }
  };

  const baseUrl = apiBaseUrl();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">API Access</h1>
            <KeyRound className="text-primary-neon" size={20} />
          </div>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        <div className="bg-card/30 rounded-card p-6 space-y-3 text-sm">
          <h2 className="text-lg font-semibold">Read-only API</h2>
          <p className="text-muted-foreground">
            Give an assistant a key so it can read your lifting sessions and habits. Keys can only
            read, never change anything, and you can revoke one at any time.
          </p>
          <div className="space-y-1">
            <div className="text-muted-foreground">Base URL</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all text-xs bg-background/60 rounded p-2">{baseUrl}</code>
              <CopyButton value={baseUrl} label="Copy base URL" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div><code>GET /sessions?from=YYYY-MM-DD&amp;to=YYYY-MM-DD</code></div>
            <div><code>GET /habits?from=YYYY-MM-DD&amp;to=YYYY-MM-DD</code></div>
            <div>Header: <code>Authorization: Bearer &lt;key&gt;</code></div>
          </div>
        </div>

        <div className="bg-card/30 rounded-card p-6 space-y-3">
          <h2 className="text-lg font-semibold">New key</h2>
          {newKey ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Copy this now and store it with your assistant. It will not be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all text-xs bg-background/60 rounded p-2">{newKey}</code>
                <CopyButton value={newKey} label="Copy API key" />
              </div>
              <Button variant="outline" size="sm" onClick={() => setNewKey(null)}>
                Done
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Name, e.g. Muse"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
              />
              <Button onClick={handleCreate} disabled={createToken.isPending}>
                {createToken.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
              </Button>
            </div>
          )}
        </div>

        <div className="bg-card/30 rounded-card p-6 space-y-3">
          <h2 className="text-lg font-semibold">Your keys</h2>
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          ) : tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keys yet.</p>
          ) : (
            <ul className="space-y-2">
              {tokens.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      <code>{t.token_prefix}…</code> · created{' '}
                      {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })} ·{' '}
                      {t.last_used_at
                        ? `used ${formatDistanceToNow(new Date(t.last_used_at), { addSuffix: true })}`
                        : 'never used'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(t.id, t.name)}
                    aria-label={`Revoke ${t.name}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
