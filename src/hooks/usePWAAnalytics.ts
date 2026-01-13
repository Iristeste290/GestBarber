import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device-id";

type PWAEventType = 'prompt_shown' | 'install_clicked' | 'install_success' | 'dismissed';

export const usePWAAnalytics = () => {
  const trackEvent = async (eventType: PWAEventType) => {
    try {
      const deviceId = getDeviceId();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Detect platform
      const userAgent = navigator.userAgent.toLowerCase();
      let platform = 'unknown';
      if (/iphone|ipad|ipod/.test(userAgent)) {
        platform = 'ios';
      } else if (/android/.test(userAgent)) {
        platform = 'android';
      } else if (/windows|macintosh|linux/.test(userAgent)) {
        platform = 'desktop';
      }

      await supabase.from('pwa_analytics').insert({
        event_type: eventType,
        platform,
        user_agent: navigator.userAgent,
        device_id: deviceId,
        user_id: user?.id || null,
      });
    } catch (error) {
      console.error('Error tracking PWA event:', error);
    }
  };

  return { trackEvent };
};
