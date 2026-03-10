"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Download } from "lucide-react";
import { toast } from "react-hot-toast";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });

      setSubscription(sub);

      await fetch("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify(sub),
        headers: {
          "Content-Type": "application/json",
        },
      });

      toast.success("Notificações ativadas!");
    } catch (error) {
      console.error("Erro ao inscrever:", error);
      toast.error("Falha ao ativar notificações.");
    }
  }

  async function unsubscribeFromPush() {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          body: JSON.stringify({ endpoint: subscription.endpoint }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        setSubscription(null);
        toast.success("Notificações desativadas.");
      }
    } catch (error) {
      console.error("Erro ao desinscrever:", error);
      toast.error("Falha ao desativar notificações.");
    }
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (!isSupported) {
    return <p className="text-sm text-gray-500">Notificações Push não suportadas neste navegador.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
        <div>
          <h3 className="font-semibold">Notificações Push</h3>
          <p className="text-sm text-muted-foreground">
            {subscription ? "Você está inscrito para receber alertas." : "Ative para receber alertas em tempo real."}
          </p>
        </div>
        <Button
          variant={subscription ? "outline" : "default"}
          onClick={subscription ? unsubscribeFromPush : subscribeToPush}
          className="flex gap-2"
        >
          {subscription ? (
            <>
              <BellOff className="w-4 h-4" /> Desativar
            </>
          ) : (
            <>
              <Bell className="w-4 h-4" /> Ativar
            </>
          )}
        </Button>
      </div>

      {deferredPrompt && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/10 border-primary/20">
          <div>
            <h3 className="font-semibold">Instalar Aplicativo</h3>
            <p className="text-sm text-muted-foreground">Adicione à sua tela inicial para acesso rápido.</p>
          </div>
          <Button onClick={handleInstallClick} className="flex gap-2">
            <Download className="w-4 h-4" /> Instalar
          </Button>
        </div>
      )}
    </div>
  );
}
