# 05 — Notificações Push (PWA)

## Princípios
- Push é **opt-in explícito** — nunca solicitar permissão no primeiro load
- Fallback in-app sempre disponível (mesmo sem push ativo)
- Payload nunca contém dados sensíveis (conteúdo de mensagem, email, etc.)
- Volume controlado — usuário nunca deve sentir spam

## Modelo de dados

```prisma
model PushSubscription {
  id         String   @id @default(cuid())
  userId     String   // = Clerk userId
  tenantId   String
  endpoint   String   @unique
  p256dh     String
  auth       String
  userAgent  String?
  createdAt  DateTime @default(now())
  lastSeenAt DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, tenantId])
}

model NotificationPreference {
  id         String               @id @default(cuid())
  userId     String
  tenantId   String
  channel    NotificationChannel
  category   NotificationCategory
  enabled    Boolean              @default(true)
  quietStart String?              // "22:00"
  quietEnd   String?              // "08:00"
  @@unique([userId, tenantId, channel, category])
}

model Notification {
  id          String               @id @default(cuid())
  userId      String
  tenantId    String
  category    NotificationCategory
  title       String
  body        String?
  actionUrl   String?
  read        Boolean              @default(false)
  createdAt   DateTime             @default(now())
  sentPushAt  DateTime?
  @@index([tenantId, userId, read])
}

enum NotificationChannel  { PUSH EMAIL IN_APP }
enum NotificationCategory { MESSAGE MENTION MODERATION BILLING EVENT SYSTEM }
```

---

## Service Worker (`public/sw.ts`)

```ts
/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})

self.addEventListener('push', (e) => {
  if (!e.data) return
  const data = e.data.json()

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { actionUrl: data.actionUrl },
      tag: data.tag, // deduplicação por tag
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.actionUrl ?? '/'

  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url))
        if (existing) return existing.focus()
        return self.clients.openWindow(url)
      })
  )
})
```

---

## PushService (`modules/push/service.ts`)

```ts
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function send(userId: string, tenantId: string, payload: {
  title: string
  body?: string
  actionUrl?: string
  tag?: string  // para deduplicação no browser
}) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, tenantId }
  })

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 } // 24h
        )
        await prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { lastSeenAt: new Date() }
        })
      } catch (err: any) {
        if (err.statusCode === 410) {
          // Subscription expirada — remover imediatamente
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        }
        throw err
      }
    })
  )

  // Logar apenas falhas, nunca o payload
  const failures = results.filter(r => r.status === 'rejected')
  if (failures.length > 0) {
    logger.warn({ userId, tenantId, failures: failures.length }, 'Push delivery failures')
  }
}
```

---

## Endpoints

```ts
// POST /api/v1/push/subscribe
export async function POST(req: Request) {
  const userId = await requireAuth()
  const { tenant } = await requireTenant(userId, params.tenantSlug)

  await checkRateLimit(rateLimiters.pushSubscribe, userId)

  const { endpoint, keys } = SubscribeSchema.parse(await req.json())

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { lastSeenAt: new Date() },
    create: {
      userId,
      tenantId: tenant.id, // vem da sessão, nunca do body
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: req.headers.get('user-agent') ?? undefined,
    }
  })

  return Response.json({ ok: true })
}

// DELETE /api/v1/push/subscribe
export async function DELETE(req: Request) {
  const userId = await requireAuth()
  const { endpoint } = DeleteSubscribeSchema.parse(await req.json())

  // Verificar ownership — nunca deletar subscription de outro usuário
  const sub = await prisma.pushSubscription.findFirst({
    where: { endpoint, userId } // userId como filtro garante ownership
  })

  if (sub) {
    await prisma.pushSubscription.delete({ where: { id: sub.id } })
  }

  return Response.json({ ok: true })
}
```

---

## Preferências e quiet hours

Verificar preferências ANTES de enfileirar qualquer push:

```ts
// modules/notifications/service.ts
export async function shouldSendPush(
  userId: string,
  tenantId: string,
  category: NotificationCategory
): Promise<boolean> {
  const pref = await prisma.notificationPreference.findFirst({
    where: { userId, tenantId, channel: 'PUSH', category }
  })

  // Default: habilitado se não tiver preferência salva
  if (!pref || !pref.enabled) return pref?.enabled ?? true

  // Verificar quiet hours
  if (pref.quietStart && pref.quietEnd) {
    const now = new Date()
    const hour = now.getHours()
    const [startH] = pref.quietStart.split(':').map(Number)
    const [endH] = pref.quietEnd.split(':').map(Number)

    // Ex: quietStart=22, quietEnd=8
    if (startH > endH) { // atravessa meia-noite
      if (hour >= startH || hour < endH) return false
    } else {
      if (hour >= startH && hour < endH) return false
    }
  }

  return true
}
```

---

## UX — regras de interface

- Botão "Ativar notificações" aparece após o usuário usar o app por X minutos ou após ação contextual
- Mostrar estado atual: **Ativo** / **Inativo** / **Bloqueado pelo navegador**
- Se bloqueado pelo navegador: instrução de como desbloquear (não é possível programaticamente)
- Ao clicar na notificação: abrir a tela exata do contexto (deep link via `actionUrl`)
- Central de notificações in-app sempre disponível (independe do push estar ativo)
