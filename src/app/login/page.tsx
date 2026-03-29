import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-panel__copy">
          <span className="eyebrow">Private, hosted, yours</span>
          <h1>Remember the gifts, not the store tabs.</h1>
          <p>
            Track gifts across every store, keep spending visible, and stop losing the thread between one occasion and
            the next.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
