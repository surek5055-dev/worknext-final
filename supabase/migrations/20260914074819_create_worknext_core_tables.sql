/*
# Create WorkNext core user data

1. New Tables
- `worknext_profiles` stores each member's public-facing career profile, including name, headline, location, target role, bio, skills, and language preference.
- `worknext_resumes` stores resume metadata and parsed content belonging to the signed-in member.
- `worknext_notifications` stores private in-app alerts for the signed-in member.

2. Security
- Row Level Security is enabled on every table.
- Every operation is restricted to the authenticated member who owns the row.
- No anonymous access is granted.

3. Important Notes
- Ownership is assigned by the database from the active session with `auth.uid()`.
- Resume files are not stored in this migration; only metadata is persisted until a private storage flow is connected.
*/

CREATE TABLE IF NOT EXISTS public.worknext_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  target_role text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  preferred_language text NOT NULL DEFAULT 'English',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.worknext_resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled resume',
  file_name text,
  file_url text,
  parsed_text text NOT NULL DEFAULT '',
  ats_score integer,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.worknext_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.worknext_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worknext_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worknext_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members can read own profile" ON public.worknext_profiles;
CREATE POLICY "members can read own profile" ON public.worknext_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "members can create own profile" ON public.worknext_profiles;
CREATE POLICY "members can create own profile" ON public.worknext_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "members can update own profile" ON public.worknext_profiles;
CREATE POLICY "members can update own profile" ON public.worknext_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "members can delete own profile" ON public.worknext_profiles;
CREATE POLICY "members can delete own profile" ON public.worknext_profiles FOR DELETE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "members can read own resumes" ON public.worknext_resumes;
CREATE POLICY "members can read own resumes" ON public.worknext_resumes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "members can create own resumes" ON public.worknext_resumes;
CREATE POLICY "members can create own resumes" ON public.worknext_resumes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "members can update own resumes" ON public.worknext_resumes;
CREATE POLICY "members can update own resumes" ON public.worknext_resumes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "members can delete own resumes" ON public.worknext_resumes;
CREATE POLICY "members can delete own resumes" ON public.worknext_resumes FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "members can read own notifications" ON public.worknext_notifications;
CREATE POLICY "members can read own notifications" ON public.worknext_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "members can create own notifications" ON public.worknext_notifications;
CREATE POLICY "members can create own notifications" ON public.worknext_notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "members can update own notifications" ON public.worknext_notifications;
CREATE POLICY "members can update own notifications" ON public.worknext_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "members can delete own notifications" ON public.worknext_notifications;
CREATE POLICY "members can delete own notifications" ON public.worknext_notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS worknext_resumes_user_id_idx ON public.worknext_resumes(user_id);
CREATE INDEX IF NOT EXISTS worknext_notifications_user_id_idx ON public.worknext_notifications(user_id, created_at DESC);