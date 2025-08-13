"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import DemoApp from "@/components/ui/DemoApp";

export default function KontrolFormuPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!alive) return;
      if (error) console.error("auth.getUser error:", error.message);
      if (!data?.user) router.replace("/login");
      else setChecking(false);
    });
    return () => { alive = false; };
  }, [router, supabase]);

  if (checking) return <div className="p-6 text-sm text-muted-foreground">Giriş kontrol ediliyor…</div>;
  return <DemoApp />;
}
