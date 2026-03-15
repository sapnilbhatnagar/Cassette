import { NextRequest, NextResponse } from "next/server";
import { findOrCreateGoogleUser, recordLogin, stripPassword } from "@/lib/users";

function decodeGoogleJwt(token: string): {
  sub: string;
  email: string;
  name: string;
} {
  const payload = token.split(".")[1];
  const decoded = Buffer.from(payload, "base64url").toString("utf-8");
  return JSON.parse(decoded);
}

export async function POST(req: NextRequest) {
  const { credential } = await req.json();

  if (!credential) {
    return NextResponse.json(
      { error: "Google credential is required" },
      { status: 400 }
    );
  }

  try {
    const { sub, email, name } = decodeGoogleJwt(credential);
    const user = findOrCreateGoogleUser(sub, email, name);
    recordLogin(user, "google");
    return NextResponse.json({ user: stripPassword(user) });
  } catch {
    return NextResponse.json(
      { error: "Invalid Google credential" },
      { status: 400 }
    );
  }
}
