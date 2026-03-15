import { NextRequest, NextResponse } from "next/server";
import { createUser, recordLogin, stripPassword } from "@/lib/users";

export async function POST(req: NextRequest) {
  const { username, email, password } = await req.json();

  if (!username || !email || !password) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  if (username.length < 3) {
    return NextResponse.json(
      { error: "Username must be at least 3 characters" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const result = createUser(username, email, password);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  recordLogin(result.user!, "credentials");
  return NextResponse.json({ user: stripPassword(result.user!) });
}
