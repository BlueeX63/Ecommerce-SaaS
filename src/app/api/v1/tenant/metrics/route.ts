import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.tenantId;
    const db = getAdminClient();

    // 1. Fetch Orders for total revenue, total orders, and chart data
    // Fetch last 7 days of orders
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: allOrders, error: ordersError } = await db
      .from("orders")
      .select("order_id, grand_total, created_at, order_number, status, customers(first_name, last_name)")
      .eq("tenant_id", tenantId);

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
    }

    const totalOrders = allOrders ? allOrders.length : 0;
    
    // Revenue only counts orders that are not CANCELLED or RETURNED
    const validRevenueOrders = allOrders ? allOrders.filter(o => o.status !== 'CANCELLED' && o.status !== 'RETURNED' && o.status !== 'RETURN_REQUESTED') : [];
    const totalRevenue = validRevenueOrders.reduce((sum, order) => sum + (Number(order.grand_total) || 0), 0);

    // Generate chart data (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayRevenue = validRevenueOrders
            .filter(o => o.created_at?.startsWith(dateString))
            .reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0);
        
      chartData.push({ name: dayName, revenue: dayRevenue });
    }

    // Top 5 recent orders
    const recentOrders = allOrders 
      ? [...allOrders]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(o => ({
            id: o.order_id,
            orderNumber: o.order_number,
            customerName: o.customers 
              ? (Array.isArray(o.customers) 
                  ? `${o.customers[0]?.first_name || ''} ${o.customers[0]?.last_name || ''}`.trim() 
                  : `${(o.customers as any).first_name || ''} ${(o.customers as any).last_name || ''}`.trim()) || 'Guest Customer'
              : 'Guest Customer',
            amount: Number(o.grand_total) || 0,
            date: o.created_at
          }))
      : [];

    // 2. Fetch Total Customers
    const { count: totalCustomersCount, error: customersError } = await db
      .from("customers")
      .select("*", { count: 'exact', head: true })
      .eq("tenant_id", tenantId);

    // 3. Fetch Total Products
    const { count: totalProductsCount, error: productsError } = await db
      .from("products")
      .select("*", { count: 'exact', head: true })
      .eq("tenant_id", tenantId);

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalCustomers: totalCustomersCount || 0,
      totalProducts: totalProductsCount || 0,
      chartData,
      recentOrders
    });
  } catch (error) {
    console.error("Metrics API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
