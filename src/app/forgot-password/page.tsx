"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Banner, Button, Field, Notice } from "@/components/ui";
import { errorMessage } from "@/lib/format";
import { createClient } from "@/lib/supabase";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage("If that email belongs to an admin, a reset link is on its way.");
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame kicker="Platform administration" title="Reset the admin password." subtitle="We will email a link if the address belongs to a platform admin.">
      <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-line bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
        {error && <Banner>{error}</Banner>}
        {message && <Notice>{message}</Notice>}
        <Field label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Button className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
        <Link href="/login" className="text-center text-sm font-medium text-pine">
          Back to sign in
        </Link>
      </form>
    </AuthFrame>
  );
}
