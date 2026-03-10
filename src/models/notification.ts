import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  category: {
    type: String,
    enum: ["MESSAGE", "MENTION", "MODERATION", "BILLING", "EVENT", "SYSTEM"],
    default: "SYSTEM",
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
  },
  actionUrl: {
    type: String,
  },
  read: {
    type: Boolean,
    default: false,
  },
  sentPushAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notifications =
  mongoose.models.notifications ||
  mongoose.model("notifications", notificationSchema);

export default Notifications;
