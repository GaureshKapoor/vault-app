-- Drop and recreate the handle_new_user function with only 3 default ideas
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Create 3 default starter ideas
  
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

  RETURN NEW;
END;
$function$;