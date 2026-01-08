import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAuthGuard() {
  const [state, setState] = useState({
    loading: true,
    allowed: false,
  });

  useEffect(() => {
    let mounted = true;
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        mounted && setState({ loading: false, allowed: false });
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status,onboarding_completed_at')
        .eq('user_id', user.id)
        .single();
      const hasSubscription = profile?.subscription_status && profile.subscription_status !== 'none';
      const hasCompletedOnboarding = !!profile?.onboarding_completed_at;
      mounted && setState({ loading: false, allowed: hasSubscription && hasCompletedOnboarding });
    };
    checkProfile();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkProfile();
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
