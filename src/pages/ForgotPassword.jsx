import React, { useState } from "react";
import { Link } from "react-router-dom";
import { appRuntime } from "@/api/localRuntime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await appRuntime.auth.resetPasswordRequest(email);
      setResetLink(`${window.location.origin}/reset-password?token=${encodeURIComponent(result.resetToken)}`);
    } catch (err) {
      setError(err.message || "Could not create a local reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout icon={Mail} title="Reset password" subtitle="Create a local reset link for this device" footer={<Link to="/login" className="text-primary font-medium hover:underline"><ArrowLeft className="w-3 h-3 inline mr-1" />Back to log in</Link>}>
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      {resetLink ? (
        <div className="space-y-4">
          <p className="text-sm text-foreground">Email delivery is not required in local mode. Use this reset link on this device:</p>
          <a href={resetLink} className="block break-all rounded-lg bg-muted p-3 text-sm text-primary hover:underline">{resetLink}</a>
          <p className="text-xs text-muted-foreground">This link is stored locally and is intended for demos and development only.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="email">Email address</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" /><Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required /></div></div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating link...</> : "Create reset link"}</Button>
        </form>
      )}
    </AuthLayout>
  );
}