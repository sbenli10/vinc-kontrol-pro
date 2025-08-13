"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Mail, Lock, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2,
  Shield, LogIn, UserPlus, Chrome, Github, ShieldCheck, User
} from "lucide-react";

type Msg = { kind: "error" | "success"; text: string } | null;
type Role = "owner"|"admin"|"manager"|"editor"|"viewer"|"operator";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextFromQuery = sp.get("next");
  const supabase = supabaseBrowser();
  const operatorHome = '/dashboard';
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [portal, setPortal] = useState<"admin" | "operator">("operator"); // ← panel seçimi
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<null | "google" | "github">(null);
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Varsayılan hedef operatör paneli
  const defaultNext = "/admin/users";
  const redirectTarget = useMemo(
    () => nextFromQuery || (portal === "admin" ? "/admin" : defaultNext),
    [nextFromQuery, portal]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!email || !password) return setMsg({ kind: "error", text: "E-posta ve şifre gerekli." });
    if (mode === "signup" && password.length < 6) {
      return setMsg({ kind: "error", text: "Şifre en az 6 karakter olmalı." });
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`,
            data: { role: "operator" as Role }, // kayıt olanlar varsayılan operatör
          },
        });
        if (error) return setMsg({ kind: "error", text: error.message });
        setMsg({ kind: "success", text: "Hesap oluşturuldu. E-postanı kontrol ettikten sonra giriş yap." });
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return setMsg({ kind: "error", text: error.message });

          // 👇 İlk girişte org + üyelik oluştur / org çerezini set et
          try { await fetch('/api/onboarding/bootstrap', { method: 'POST' }); } catch {}

          const operatorHome = "/dashboard";
          const target = portal === "operator" ? operatorHome : (nextFromQuery || "/admin");
          router.replace(target);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setMsg(null);
    setOauthLoading("google");
    const next = redirectTarget; // panel seçimine göre next
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setMsg({ kind: "error", text: error.message });
      setOauthLoading(null);
    }
  }

  async function signInWithGithub() {
    setMsg(null);
    setOauthLoading("github");
    const next = redirectTarget;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setMsg({ kind: "error", text: error.message });
      setOauthLoading(null);
    }
  }

  async function sendReset() {
    setMsg(null);
    if (!email) return setMsg({ kind: "error", text: "Şifre sıfırlama için e-posta girin." });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`,
    });
    if (error) return setMsg({ kind: "error", text: error.message });
    setMsg({ kind: "success", text: "Sıfırlama bağlantısı e-postanıza gönderildi." });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        <CardContent className="p-6 space-y-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 ring-1 ring-blue-500/40">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight">
                Vinc<span className="text-blue-400">Kontrol</span> Pro
              </h1>
              <p className="text-xs text-slate-400">Yönetici ve Operatör girişi</p>
            </div>
          </div>

          {/* Panel seçimi */}
          <div className="rounded-xl bg-slate-800 p-1 grid grid-cols-2">
            <button
              type="button"
              onClick={() => setPortal("operator")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs ${
                portal === "operator" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700/40"
              }`}
              aria-pressed={portal === "operator"}
            >
              <User size={14} /> Operatör Girişi
            </button>
            <button
              type="button"
              onClick={() => setPortal("admin")}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs ${
                portal === "admin" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700/40"
              }`}
              aria-pressed={portal === "admin"}
            >
              <ShieldCheck size={14} /> Yönetici (Admin) Girişi
            </button>
          </div>

          {/* Login / Signup sekmeleri */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-slate-800">
              <TabsTrigger value="login" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                <LogIn className="w-4 h-4 mr-2" /> Giriş Yap
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                <UserPlus className="w-4 h-4 mr-2" /> Kayıt Ol
              </TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@firma.com"
                      className="pl-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                      required autoComplete="email" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input id="password" type={showPw ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                      className="pl-9 pr-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                      required autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2 top-2.5 p-1 rounded hover:bg-slate-700"
                      aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}>
                      {showPw ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>

                {msg && (
                  <div className={`flex items-start gap-2 rounded-md p-3 text-sm ${
                    msg.kind === "error"
                      ? "bg-red-500/10 text-red-300 border border-red-500/30"
                      : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                  }`}>
                    {msg.kind === "error" ? <AlertTriangle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
                    <span>{msg.text}</span>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-600/90">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                  Giriş Yap
                </Button>

                <div className="flex justify-between text-xs text-slate-400">
                  <button type="button" onClick={sendReset} className="underline underline-offset-4 hover:text-slate-300">
                    Şifremi unuttum
                  </button>
                  <button type="button" onClick={() => setMode("signup")} className="underline underline-offset-4 hover:text-slate-300">
                    Hesabın yok mu? Kayıt ol
                  </button>
                </div>
              </form>
            </TabsContent>

            {/* SIGNUP */}
            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-su" className="text-slate-300">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input id="email-su" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@firma.com"
                      className="pl-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                      required autoComplete="email" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-su" className="text-slate-300">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input id="password-su" type={showPw ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="En az 6 karakter"
                      className="pl-9 pr-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                      required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute right-2 top-2.5 p-1 rounded hover:bg-slate-700"
                      aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}>
                      {showPw ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>

                {msg && (
                  <div className={`flex items-start gap-2 rounded-md p-3 text-sm ${
                    msg.kind === "error"
                      ? "bg-red-500/10 text-red-300 border border-red-500/30"
                      : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                  }`}>
                    {msg.kind === "error" ? <AlertTriangle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
                    <span>{msg.text}</span>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-600/90">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Kayıt Ol
                </Button>

                <p className="text-xs text-slate-400 text-center">
                  Kaydolarak şartları kabul etmiş olursunuz.
                </p>

                <div className="text-xs text-slate-400 text-center">
                  Zaten hesabın var mı?{" "}
                  <button type="button" onClick={() => setMode("login")} className="underline underline-offset-4 hover:text-slate-300">
                    Giriş Yap
                  </button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          {/* OAuth */}
          <div className="relative">
            <div className="flex items-center gap-2 my-4">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-xs text-slate-400">veya</span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={signInWithGoogle} variant="outline" className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700" disabled={!!oauthLoading}>
                {oauthLoading === "google" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Chrome className="w-4 h-4 mr-2" />}
                Google ile devam et
              </Button>
              <Button onClick={signInWithGithub} variant="outline" className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700" disabled={!!oauthLoading}>
                {oauthLoading === "github" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Github className="w-4 h-4 mr-2" />}
                GitHub ile devam et
              </Button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            Yönetici seçeneğini tercih etseniz bile yetkiniz yoksa operatör paneline yönlendirilirsiniz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
