import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
  try {
    // 1. In a real app, you'd get the tenant_id from the authenticated user session.
    // For this boilerplate, we'll fetch the first tenant.
    const { data: tenantData } = await supabase.from('tenant').select('tenant_id').limit(1).single();
    if (!tenantData) return NextResponse.json({ error: "No tenant found" }, { status: 404 });

    const tenantId = tenantData.tenant_id;

    // 2. Fetch the setting
    const { data: settingData, error } = await supabase
      .from('tenant_settings')
      .select('setting_value')
      .eq('tenant_id', tenantId)
      .eq('setting_key', 'customization')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(error);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    let customization = {};
    if (settingData && settingData.setting_value) {
      try {
        customization = JSON.parse(settingData.setting_value);
      } catch (e) {
        console.error("Failed to parse customization JSON", e);
      }
    }

    return NextResponse.json(customization);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Get tenant
    const { data: tenantData } = await supabase.from('tenant').select('tenant_id').limit(1).single();
    if (!tenantData) return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    const tenantId = tenantData.tenant_id;

    // 2. Get existing customization to merge
    const { data: settingData } = await supabase
      .from('tenant_settings')
      .select('setting_value')
      .eq('tenant_id', tenantId)
      .eq('setting_key', 'customization')
      .single();

    let customization = {};
    if (settingData && settingData.setting_value) {
      try {
        customization = JSON.parse(settingData.setting_value);
      } catch (e) {}
    }

    // 3. Merge new data
    const newCustomization = {
      ...customization,
      ...body
    };

    // 4. Upsert
    const { error: upsertError } = await supabase
      .from('tenant_settings')
      .upsert({
        tenant_id: tenantId,
        setting_key: 'customization',
        setting_value: JSON.stringify(newCustomization)
      }, { onConflict: 'tenant_id,setting_key' });

    if (upsertError) {
      console.error(upsertError);
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }

    return NextResponse.json(newCustomization);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
