import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppNav } from "@/components/app-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <AppNav />
      <main className="content">
        <header className="content__header">
          <div>
            <span className="eyebrow">Signed in as</span>
            <strong>{session.user.email}</strong>
          </div>
          <SignOutButton />
        </header>
        {children}
      </main>
    </div>
  );
}
