import webpush from "web-push";
import connectDB from "@/configs/dbConfig/dbConfig";
import PushSubscriptions from "@/models/pushSubscription";
import Notifications from "@/models/notification";

export async function sendPushNotification(
  userId: string,
  payload: {
    title: string;
    body?: string;
    actionUrl?: string;
    tag?: string;
    category?: "MESSAGE" | "MENTION" | "MODERATION" | "BILLING" | "EVENT" | "SYSTEM";
  }
) {
  try {
    await connectDB();

    // Configure VAPID
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:example@example.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Save notification in DB
    const notification = await Notifications.create({
      userId,
      category: payload.category || "SYSTEM",
      title: payload.title,
      body: payload.body,
      actionUrl: payload.actionUrl,
    });

    // Get all subscriptions for this user
    const subscriptions = await PushSubscriptions.find({ userId });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
            { TTL: 60 * 60 * 24 } // 24 hours
          );

          // Update last seen
          await PushSubscriptions.findByIdAndUpdate(sub._id, {
            lastSeenAt: new Date(),
          });
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired or gone - remove it
            await PushSubscriptions.findByIdAndDelete(sub._id);
          }
          throw err;
        }
      })
    );

    // Update notification status if at least one push was sent successfully
    const sentCount = results.filter((r) => r.status === "fulfilled").length;
    if (sentCount > 0) {
      await Notifications.findByIdAndUpdate(notification._id, {
        sentPushAt: new Date(),
      });
    }

    return { success: true, sentCount };
  } catch (error) {
    console.error("Push Notification Error:", error);
    return { success: false, error };
  }
}
