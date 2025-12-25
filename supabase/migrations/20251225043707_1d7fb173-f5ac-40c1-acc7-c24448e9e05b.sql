-- Drop and recreate handle_new_user function with correct template ideas
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  -- Create 3 default template ideas matching landing page
  
  -- Default #1: Mood Tracker with Spotify
  INSERT INTO public.ideas (user_id, title, description, category, main_idea, core_problem, core_value_proposition, core_loop, mvp_shape, target_user, difficulty, priority, sprint_fit, status, ai_score, check_clear_problem, check_simple_loop, check_deployable_mvp, is_template, sort_order)
  VALUES (
    NEW.id,
    'Mood Tracker',
    'A mood tracker that uses Spotify listening history to correlate music with emotional states.',
    'Health',
    'An app that tracks daily moods and automatically pulls Spotify listening data to find patterns between music choices and emotional well-being.',
    'People struggle to understand what influences their mood and lack objective data to identify emotional patterns.',
    'Discover hidden connections between your music and emotions with automatic mood-music correlation.',
    'Log mood → Auto-fetch Spotify data → Show correlations → Weekly insights',
    'Mobile-first PWA with Spotify OAuth, simple mood logging, and basic correlation charts.',
    'Music lovers interested in self-improvement and mental wellness',
    2, 4, 3, 'idea', 7.8,
    true, true, true,
    true, 1
  );

  -- Default #2: Voice Memo Idea Capture
  INSERT INTO public.ideas (user_id, title, description, category, main_idea, core_problem, core_value_proposition, core_loop, mvp_shape, target_user, difficulty, priority, sprint_fit, status, ai_score, check_clear_problem, check_simple_loop, check_deployable_mvp, is_template, sort_order)
  VALUES (
    NEW.id,
    'Voice Memo Idea Capture',
    'Quick voice-to-text idea capture with AI organization and tagging.',
    'Productivity',
    'A voice-first app for capturing ideas on the go, with AI transcription and automatic categorization.',
    'Great ideas slip away because typing on mobile is slow and inconvenient.',
    'Never lose an idea again. Speak it, and AI handles the rest.',
    'Record voice → AI transcribes → Auto-tag & organize → Search & review',
    'Mobile app with voice recording, speech-to-text API, and simple folder organization.',
    'Entrepreneurs, creatives, and busy professionals',
    2, 4, 4, 'idea', 8.5,
    true, true, true,
    true, 2
  );

  -- Default #3: Side Project Tracker
  INSERT INTO public.ideas (user_id, title, description, category, main_idea, core_problem, core_value_proposition, core_loop, mvp_shape, target_user, difficulty, priority, sprint_fit, status, ai_score, check_clear_problem, check_simple_loop, check_deployable_mvp, is_template, sort_order)
  VALUES (
    NEW.id,
    'Side Project Tracker',
    'Notion-style database for tracking side projects with progress and deadlines.',
    'Productivity',
    'A streamlined project tracker designed specifically for indie hackers and side project enthusiasts.',
    'Side projects get abandoned because there is no simple way to track progress and maintain momentum.',
    'Ship more projects by tracking what matters: progress, blockers, and next actions.',
    'Add project → Set milestones → Log progress → Review weekly',
    'Web app with kanban board, simple milestone tracking, and weekly digest emails.',
    'Indie hackers, developers with side projects, and weekend builders',
    2, 4, 4, 'idea', 8.2,
    true, true, true,
    true, 3
  );

  RETURN NEW;
END;
$function$;