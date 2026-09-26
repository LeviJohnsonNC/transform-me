-- Personal API keys, so an outside assistant can read a user's training data
-- without holding their password.
--
-- Only a SHA-256 hash of each key is stored. The app generates the key in the
-- browser, shows it once, and inserts the hash; the `api` edge function hashes
-- the bearer token it receives and looks it up here with the service role.
-- A leaked row therefore cannot be replayed as a key.
--
-- Keys are read-only by construction: the edge function only ever SELECTs.
CREATE TABLE IF NOT EXISTS public.api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  -- Hex SHA-256 of the full key.
  token_hash text NOT NULL UNIQUE,
  -- The first few characters of the key, so the list can tell keys apart.
  token_prefix text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS api_tokens_user_id_idx ON public.api_tokens (user_id);

ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

-- No UPDATE policy: a key is created and deleted, never edited. `last_used_at`
-- is written by the edge function with the service role, which bypasses RLS.
CREATE POLICY "own api tokens select" ON public.api_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own api tokens insert" ON public.api_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own api tokens delete" ON public.api_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
