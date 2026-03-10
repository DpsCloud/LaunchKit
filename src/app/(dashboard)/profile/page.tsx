"use client";
import axios from "axios";
import React, { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PushNotificationManager from "@/components/PushNotificationManager";

const Profile = () => {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login");
    },
  });

  if (status === "loading") {
    return <div className="h-full flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
            <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-bold">{session?.user?.name}</CardTitle>
            <p className="text-muted-foreground">{session?.user?.email}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="p-3 border rounded bg-muted/20">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Cargo</p>
              <p className="font-medium capitalize">{(session?.user as any)?.role || "user"}</p>
            </div>
            <div className="p-3 border rounded bg-muted/20">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
              <p className="font-medium">Autenticado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Configurações de Notificações</h2>
        <PushNotificationManager />
      </div>

      <div className="flex justify-center mt-8">
        <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
          Sair da Conta
        </Button>
      </div>
    </div>
  );
};

export default Profile;
