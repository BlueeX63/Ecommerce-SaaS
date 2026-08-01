import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-07-29.dahlia', // using latest stable or default apiVersion for stripe sdk
});

const plansData: Record<string, any> = {
  pro: {
    name: 'Pro',
    priceAmountMonthly: 3999 * 100, // in paise
    priceAmountAnnual: 3199 * 12 * 100, // in paise
  }
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, isAnnual } = await req.json();
    const plan = plansData[planId];

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Since we might not have STRIPE_PRICE_IDs created yet, we can create a price on the fly for testing
    // In production, you would use predefined Price IDs from the Stripe Dashboard.
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `${plan.name} Plan (${isAnnual ? 'Yearly' : 'Monthly'})`,
            },
            unit_amount: isAnnual ? plan.priceAmountAnnual : plan.priceAmountMonthly,
            recurring: {
              interval: isAnnual ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/checkout/${planId}?canceled=true`,
      metadata: {
        userId: user.id,
        planId: planId,
        isAnnual: isAnnual ? 'true' : 'false'
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session. Please check your Stripe keys.' },
      { status: 500 }
    );
  }
}
