-- Create status enum (removed 'exploring', added 'archived')
CREATE TYPE public.idea_status AS ENUM ('idea', 'shortlisted', 'building', 'paused', 'shipped', 'archived');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ideas table
CREATE TABLE public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  main_idea TEXT,
  core_problem TEXT NOT NULL,
  core_value_proposition TEXT NOT NULL,
  core_loop TEXT,
  mvp_shape TEXT,
  target_user TEXT,
  difficulty INT CHECK (difficulty >= 1 AND difficulty <= 5),
  priority INT CHECK (priority >= 1 AND priority <= 5),
  sprint_fit INT CHECK (sprint_fit >= 1 AND sprint_fit <= 5),
  status idea_status NOT NULL DEFAULT 'idea',
  ai_score NUMERIC(3,1) CHECK (ai_score >= 0 AND ai_score <= 10),
  ai_reasoning TEXT,
  check_clear_problem BOOLEAN DEFAULT false,
  check_simple_loop BOOLEAN DEFAULT false,
  check_deployable_mvp BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique index: only ONE idea per user can be 'building'
CREATE UNIQUE INDEX idx_one_building_per_user 
ON public.ideas (user_id) 
WHERE status = 'building';

-- Create idea_notes table
CREATE TABLE public.idea_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_notes ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Ideas RLS policies
CREATE POLICY "Users can view their own ideas"
ON public.ideas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ideas"
ON public.ideas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ideas"
ON public.ideas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ideas"
ON public.ideas FOR DELETE
USING (auth.uid() = user_id);

-- Idea notes RLS policies
CREATE POLICY "Users can view their own notes"
ON public.idea_notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
ON public.idea_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.idea_notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.idea_notes FOR DELETE
USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at
BEFORE UPDATE ON public.ideas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_idea_notes_updated_at
BEFORE UPDATE ON public.idea_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile and default ideas on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_profile_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  RETURNING id INTO new_profile_id;

  -- Create 6 default starter ideas (one per status except archived)
  
  -- 1. IDEA status - simple, low difficulty, fresh concept
  INSERT INTO public.ideas (user_id, title, description, category, main_idea, core_problem, core_value_proposition, core_loop, mvp_shape, target_user, difficulty, priority, sprint_fit, status, ai_score, check_clear_problem, check_simple_loop, check_deployable_mvp)
  VALUES (
    NEW.id,
    'Daily Gratitude Journal',
    'A simple app for daily gratitude practice',
    'Health',
    'A minimalist mobile app that prompts users to write 3 things they are grateful for each day, with weekly reflection summaries.',
    'People struggle to maintain consistent gratitude practices despite knowing the mental health benefits.',
    'Build a lasting gratitude habit with gentle daily prompts and beautiful weekly insights.',
    'Daily notification → Write 3 gratitudes → See streak → Weekly summary email',
    'Mobile-first PWA with push notifications, simple text input, and streak counter.',
    'Wellness-conscious professionals aged 25-45',
    1, 3, 4, 'idea', 7.2,
    true, true, false
  );

  -- 2. SHORTLISTED status - medium difficulty, high priority, validated concept
  INSERT INTO public.ideas (user_id, title, description, category, main_idea, core_problem, core_value_proposition, core_loop, mvp_shape, target_user, difficulty, priority, sprint_fit, status, ai_score, check_clear_problem, check_simple_loop, check_deployable_mvp)
  VALUES (
    NEW.id,
    'Freelancer Invoice Tracker',
    'Simple invoicing and payment tracking for freelancers',
    'FinTech',
    'An all-in-one tool for freelancers to create invoices, track payments, and get reminders for overdue invoices.',
    'Freelancers lose money and time manually tracking invoices across spreadsheets and email.',
    'Get paid faster with automatic invoice tracking and smart payment reminders.',
    'Create invoice → Send to client → Track status → Auto-remind → Mark paid',
    'Web app with invoice templates, client database, and email integration.',
    'Independent freelancers and consultants',
    3, 5, 3, 'shortlisted', 8.5,
    true, true, true
  );

  -- 3. BUILDING status - medium difficulty, actively in progress
  INSERT INTO public.ideas (user_id, title, description, category, main_idea, core_problem, core_value_proposition, core_loop, mvp_shape, target_user, difficulty, priority, sprint_fit, status, ai_score, check_clear_problem, check_simple_loop, check_deployable_mvp)
  VALUES (
    NEW.id,
    'AI Meeting Summarizer',
    'Automatic meeting notes and action items from recordings',
    'AI',
    'Upload a meeting recording and get AI-generated summaries, action items, and follow-up tasks automatically.',
    'Professionals spend hours writing meeting notes and often miss important action items.',
    'Never miss an action item again. Get perfect meeting notes in seconds.',
    'Upload recording → AI transcribes → Extract action items → Share with team',
    'Web app with file upload, AI processing, and shareable summary pages.',
    'Remote teams and busy executives',
    3, 5, 4, 'building', 9.1,
    true, true, true
  );

  -- 4. PAUSED status - high difficulty, lower priority, complex concept
  INSERT INTO public.ideas (user_id, title, description, category, main_idea, core_problem, core_value_proposition, core_loop, mvp_shape, target_user, difficulty, priority, sprint_fit, status, ai_score, check_clear_problem, check_simple_loop, check_deployable_mvp)
  VALUES (
    NEW.id,
    'Decentralized Identity Wallet',
    'Self-sovereign identity management on blockchain',
    'Web3',
    'A wallet app that lets users own and control their digital identity credentials without relying on centralized providers.',
    'Users have no control over their digital identity and are vulnerable to data breaches and platform lock-in.',
    'Own your identity. Share credentials securely without giving away your data.',
    'Create identity → Add credentials → Verify with services → Revoke access anytime',
    'Mobile wallet with DID support, credential storage, and QR-based verification.',
    'Privacy-conscious early adopters and crypto enthusiasts',
    5, 2, 1, 'paused', 6.3,
    true, false, false
  );

  -- 5. SHIPPED status - completed, was medium difficulty
  INSERT INTO public.ideas (user_id, title, description, category, main_idea, core_problem, core_value_proposition, core_loop, mvp_shape, target_user, difficulty, priority, sprint_fit, status, ai_score, check_clear_problem, check_simple_loop, check_deployable_mvp)
  VALUES (
    NEW.id,
    'Habit Streak Tracker',
    'Gamified habit building with streaks and rewards',
    'Productivity',
    'A fun habit tracking app that uses streaks, achievements, and social accountability to help users build lasting habits.',
    'People start habits but fail to maintain them due to lack of motivation and accountability.',
    'Build unbreakable habits with the power of streaks and friendly competition.',
    'Set habit → Daily check-in → Build streak → Earn badges → Share progress',
    'Mobile app with habit list, streak calendar, achievement system, and friend leaderboards.',
    'Self-improvement enthusiasts aged 18-35',
    2, 4, 5, 'shipped', 8.8,
    true, true, true
  );

  -- 6. ARCHIVED status - old idea that didnt work out
  INSERT INTO public.ideas (user_id, title, description, category, main_idea, core_problem, core_value_proposition, core_loop, mvp_shape, target_user, difficulty, priority, sprint_fit, status, ai_score, check_clear_problem, check_simple_loop, check_deployable_mvp)
  VALUES (
    NEW.id,
    'Local Marketplace for Homemade Food',
    'Connect home cooks with hungry neighbors',
    'Social',
    'A platform where home cooks can sell homemade meals to people in their neighborhood.',
    'People want home-cooked meals but dont have time to cook, while talented home cooks want to earn extra income.',
    'Taste authentic home cooking from your neighbors. Support local cooks.',
    'Cook lists meal → Neighbor orders → Cook prepares → Pickup or delivery',
    'Mobile app with chef profiles, menu listings, ordering, and payment.',
    'Urban professionals and home cooking enthusiasts',
    4, 2, 2, 'archived', 5.4,
    true, false, false
  );

  RETURN NEW;
END;
$$;

-- Trigger to create profile and default ideas on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();