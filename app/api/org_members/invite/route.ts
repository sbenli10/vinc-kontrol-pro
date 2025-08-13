import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, role } = await req.json();
  if (!email) return new Response(JSON.stringify({ error: "email_required" }), { status: 400 });

  const allowed = new Set(["operator","viewer","manager","admin"]);
  const roleSafe = allowed.has(role) ? role : "operator";
  const normalizedEmail = String(email).trim().toLowerCase();

  const cookieStore = cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: async (n) => (await cookieStore).get(n)?.value, set(){}, remove(){} } }
  );

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401 });

  const { data: memberships } = await sb.from("org_members").select("org_id,role").eq("user_id", user.id);
  const orgId = (await cookieStore).get("org")?.value ?? memberships?.[0]?.org_id ?? null;
  if (!orgId) return new Response(JSON.stringify({ error: "no_org" }), { status: 400 });

  const me = memberships?.find(m => m.org_id === orgId);
  if (!me || me.role !== "admin") return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });

  // 1) Daveti upsert et (org_id + email_ci)
  const { error: invErr } = await sb.from("org_invites").upsert({
    org_id: orgId,
    email: normalizedEmail,
    role: roleSafe,
    invited_by: user.id,
    status: "pending",
    invited_at: new Date().toISOString(),
  }, { onConflict: "org_id,email_ci" });
  if (invErr) return new Response(JSON.stringify({ error: invErr.message }), { status: 400 });

  // 2) E-posta daveti (SMTP yoksa hata verebilir; akışı durdurma)
  let invitedUserId: string | null = null;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail);
    if (!error) invitedUserId = data.user?.id ?? null;
  } catch {}

  // 3) Zaten kayıtlıysa id'yi bul → hemen org'a ekle + invite accepted
  if (!invitedUserId) {
    try {
      const { data: found } = await supabaseAdmin.rpc("get_user_id_by_email", { p_email: normalizedEmail });
      invitedUserId = (found as string | null) ?? null;
    } catch { invitedUserId = null; }
  }

  if (invitedUserId) {
    await sb.from("org_members").upsert({ org_id: orgId, user_id: invitedUserId, role: roleSafe });
    await sb.from("org_invites").update({
      status: "accepted", user_id: invitedUserId, accepted_at: new Date().toISOString()
    })
    .eq("org_id", orgId).eq("email", normalizedEmail);

    return new Response(JSON.stringify({ ok: true, message: "Üye eklendi ve davet tamamlandı." }),
      { headers: { "Content-Type": "application/json" } });
  }

  // 4) Kayıtlı değilse: maili tıklayıp kayıt olduğunda trigger org_members’a ekleyecek
  return new Response(JSON.stringify({ ok: true, message: "Davet gönderildi. Kullanıcı onaylayınca otomatik eklenecek." }),
    { headers: { "Content-Type": "application/json" } });
}
