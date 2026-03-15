import { NextRequest, NextResponse } from "next/server";
import { validateCredentials, recordLogin, stripPassword } from "@/lib/users";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const user = validateCredentials(username, password);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  recordLogin(user, "credentials");
  return NextResponse.json({ user: stripPassword(user) });
}
