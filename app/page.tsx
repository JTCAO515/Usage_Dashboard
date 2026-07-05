import { cookies } from "next/headers";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";
import Dashboard from "./ui";

export default async function Page() {
  const authed = isValidSession((await cookies()).get(SESSION_COOKIE)?.value);
  return <Dashboard authed={authed} />;
}
