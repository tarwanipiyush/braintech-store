
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLoginLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("braintech_admin_session")?.value;

  if (token) {
    const apiBase = process.env.BRAINTECH_API_BASE_URL;

    if (apiBase) {
      try {
        const response = await fetch(`${apiBase}/admin-session.php`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.admin) {
            redirect("/admin");
          }
        }
      } catch (error) {
        if (error?.digest?.startsWith("NEXT_REDIRECT")) {
          throw error;
        }

        console.error("Admin login session check failed:", error);
      }
    }
  }

  return children;
}
