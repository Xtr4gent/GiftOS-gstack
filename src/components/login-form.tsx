"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="card form"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const formData = new FormData(event.currentTarget);
        const result = await signIn("credentials", {
          identifier: formData.get("identifier"),
          password: formData.get("password"),
          redirect: false,
          callbackUrl,
        });

        setPending(false);

        if (!result || result.error) {
          setError("That login did not work. Double-check the seeded owner account.");
          return;
        }

        router.push(callbackUrl);
        router.refresh();
      }}
    >
      <div>
        <span className="eyebrow">Owner login</span>
        <h2>Keep the vault private</h2>
      </div>
      <label>
        Username or email
        <input name="identifier" type="text" required autoComplete="username" />
      </label>
      <label>
        Password
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {error ? <p className="form__error">{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
