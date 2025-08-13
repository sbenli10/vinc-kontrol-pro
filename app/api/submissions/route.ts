// app/api/submissions/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

const schema = z.object({
  assignment_id: z.string().uuid(),
  answers: z.record(z.string(), z.unknown()), // key: string, value: unknown
});

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 401 });
  }
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // body parse + şema
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // assignment doğrulama
  const { data: asg, error: aerr } = await supabase
    .from("assignments")
    .select("id, org_id, assignee_id, status")
    .eq("id", parsed.data.assignment_id)
    .single();

  if (aerr || !asg) {
    return NextResponse.json({ error: "assignment_not_found" }, { status: 404 });
  }
  if (asg.assignee_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (asg.status !== "pending") {
    return NextResponse.json({ error: "already_submitted_or_closed" }, { status: 409 });
  }

  // insert (RLS için org_id kritik)
  const { data: sub, error } = await supabase
    .from("submissions")
    .insert({
      org_id: asg.org_id,
      assignment_id: asg.id,
      submitted_by: user.id,
      answers: parsed.data.answers,
      status: "submitted",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // assignment status -> submitted
  await supabase.from("assignments").update({ status: "submitted" }).eq("id", asg.id);

  return NextResponse.json({ submission: sub }, { status: 201 });
}
