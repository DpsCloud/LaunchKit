import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { options } from "@/app/api/auth/[...nextauth]/Options";
import connectDB from "@/configs/dbConfig/dbConfig";
import PushSubscriptions from "@/models/pushSubscription";
import { StatusCodes } from "http-status-codes";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(options);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: StatusCodes.UNAUTHORIZED });
    }

    const { endpoint, keys } = await req.json();

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: StatusCodes.BAD_REQUEST });
    }

    await connectDB();

    // Find user by email to get their ObjectId
    const Users = (await import("@/models/user")).default;
    const user = await Users.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: StatusCodes.NOT_FOUND });
    }

    await PushSubscriptions.findOneAndUpdate(
      { endpoint },
      {
        userId: user._id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: req.headers.get("user-agent") ?? undefined,
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true }, { status: StatusCodes.OK });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(options);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: StatusCodes.UNAUTHORIZED });
    }

    const { endpoint } = await req.json();

    await connectDB();
    const Users = (await import("@/models/user")).default;
    const user = await Users.findOne({ email: session.user.email });

    if (user) {
      await PushSubscriptions.deleteOne({ endpoint, userId: user._id });
    }

    return NextResponse.json({ ok: true }, { status: StatusCodes.OK });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
}
