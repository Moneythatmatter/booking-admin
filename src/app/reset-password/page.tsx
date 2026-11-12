"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Banner, Button, Field } from "@/components/ui";
import { errorMessage } from "@/lib/format";
import { createClient } from "@/lib/supabase";

export default function ResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      router.push("/");
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFrame kicker="Platform administration" title="Choose a new password." subtitle="Open this page from the reset email so the recovery session is present.">
      <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-line bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <h1 className="text-2xl font-bold tracking-tight">New password</h1>
        {error && <Banner>{error}</Banner>}
        <Field label="Password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthFrame>
  );
}
