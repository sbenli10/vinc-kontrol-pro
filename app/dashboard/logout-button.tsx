// app/dashboard/logout-button.tsx
"use client";

import { supabaseBrowser } from "@/lib/supabaseBrowser"; // Doğru import
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = supabaseBrowser(); // Browser client oluştur

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Çıkış yapılırken hata:", error.message);
      return;
    }
    router.replace("/login");
  };

  return (
    <button
      onClick={signOut}
      className="rounded border px-3 py-1 hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      Çıkış
    </button>
  );
}
