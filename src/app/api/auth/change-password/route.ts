import { NextRequest, NextResponse } from "next/server";
import { changePassword } from "@/lib/users";

export async function POST(req: NextRequest) {
  const { userId, oldPassword, newPassword } = await req.json();

  if (!userId || !newPassword) {
    return NextResponse.json(
      { error: "User ID and new password are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const result = changePassword(userId, oldPassword || "", newPassword);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
