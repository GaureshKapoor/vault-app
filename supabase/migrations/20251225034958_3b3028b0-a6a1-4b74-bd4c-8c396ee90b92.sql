-- Add subscription and onboarding fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_type TEXT,
ADD COLUMN IF NOT EXISTS building_experience TEXT,
ADD COLUMN IF NOT EXISTS tools_used TEXT[],
ADD COLUMN IF NOT EXISTS goals TEXT[],
ADD COLUMN IF NOT EXISTS weekly_hours TEXT,
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT false;

-- Add check constraints for valid values
ALTER TABLE public.profiles
ADD CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('free', 'pro')),
ADD CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('none', 'trial', 'active', 'cancelled'));