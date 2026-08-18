import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session || !session.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminClient();
  const { data: tenant } = await db.from("tenant").select("*").eq("tenant_id", session.tenantId).single();
  
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  return NextResponse.json({ tenant });
}

export async function DELETE() {
  const session = await getSession();
  if (!session || !session.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminClient();
  const { error } = await db.from("tenant").delete().eq("tenant_id", session.tenantId);
  
  if (error) {
    console.error("Failed to delete tenant:", error);
    return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 });
  }

  return NextResponse.json({ message: "Store deleted successfully" }, { status: 200 });
}
