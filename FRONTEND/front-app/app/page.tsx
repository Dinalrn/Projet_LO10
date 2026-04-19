import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function RootPage() {
  const session = await getSession();
  // Already logged in → go to the app, otherwise → login
  redirect(session ? "/pages" : "/login");
}
