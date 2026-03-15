import { NextResponse } from "next/server";
import { getAllUsers, getLoginHistory } from "@/lib/users";

export async function GET() {
  return NextResponse.json({
    users: getAllUsers(),
    loginHistory: getLoginHistory(),
  });
}
