import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface PushServiceWorkerRegistration extends ServiceWorkerRegistration {
  pushManager: PushManager;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(userId?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  // Fetch VAPID public key from backend
  useEffect(() => {
    const fetchVapidKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-vapid-key");
        if (!error && data?.vapidPublicKey) {
          // Defensive: normalize potential quoted values (e.g. "\"B...\"")
          const cleaned = String(data.vapidPublicKey).trim().replace(/^"+|"+$/g, "");
          setVapidKey(cleaned);
        }
      } catch (err) {
        console.error("Error fetching VAPID key:", err);
      }
    };
    fetchVapidKey();
  }, []);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
      
      setIsLoading(false);
    };

    checkSupport();
  }, []);

  // Check current subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported || !userId) return;

      try {
        const registration = await navigator.serviceWorker.ready as unknown as PushServiceWorkerRegistration;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    };

    checkSubscription();
  }, [isSupported, userId]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || !userId) {
      toast.error("Push notifications não são suportadas neste navegador");
      return false;
    }

    if (!vapidKey) {
      toast.error("Configuração de notificações não encontrada");
      return false;
    }

    try {
      setIsLoading(true);

      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        toast.error("Permissão para notificações negada");
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready as unknown as PushServiceWorkerRegistration;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      // If no subscription, create one
      if (!subscription) {
        const cleanedVapidKey = String(vapidKey).trim().replace(/^"+|"+$/g, "");
        const applicationServerKey = urlBase64ToUint8Array(cleanedVapidKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });
      }

      // Save subscription to database - convert to plain object for Json type
      const subscriptionJson = JSON.parse(JSON.stringify(subscription.toJSON())) as Json;
      
      // Save subscription to database (idempotent)
      // Use upsert to avoid relying on SELECT policies and to handle unique(user_id)
      const { error: upsertError } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: userId,
            subscription: subscriptionJson,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (upsertError) throw upsertError;

      setIsSubscribed(true);
      toast.success("Notificações push ativadas!");
      
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error subscribing to push:", error);
      toast.error("Erro ao ativar notificações", { description: message });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, userId, vapidKey]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!userId) return false;

    try {
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready as unknown as PushServiceWorkerRegistration;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from database
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId);

      setIsSubscribed(false);
      toast.info("Notificações push desativadas");
      
      return true;
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error("Erro ao desativar notificações");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Test push notification
  const testPush = useCallback(async () => {
    if (!userId || !isSubscribed) {
      toast.error("Ative as notificações primeiro");
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          userId,
          title: "🔔 Teste de Notificação",
          body: "As notificações push estão funcionando!",
          data: { test: true },
        },
      });

      if (error) throw error;
      
      toast.success("Notificação de teste enviada!");
    } catch (error) {
      console.error("Error sending test push:", error);
      toast.error("Erro ao enviar notificação de teste");
    }
  }, [userId, isSubscribed]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    testPush,
  };
}
