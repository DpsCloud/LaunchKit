import React from "react";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/Options";
import { redirect } from "next/navigation";
import connectDB from "@/configs/dbConfig/dbConfig";
import Users from "@/models/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PushNotificationManager from "@/components/PushNotificationManager";

export default async function ProfilePage() {
  const session = await getServerSession(options);

  if (!session?.user) {
    redirect("/login");
  }

  await connectDB();
  const user = await Users.findOne({ email: session.user.email });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-bold">{user.name}</CardTitle>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="p-3 border rounded bg-muted/20">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Cargo</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
            <div className="p-3 border rounded bg-muted/20">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
              <p className="font-medium">{user.isVarified ? "Verificado" : "Pendente"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Configurações de Notificações</h2>
        <PushNotificationManager />
      </div>
    </div>
  );
}
