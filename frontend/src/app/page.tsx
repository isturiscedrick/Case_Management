import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value; // adjust cookie name to match your backend

  if (token) {
    redirect("/cases");
  } else {
    redirect("/login");
  }
}