import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

// apiVersion laissée par défaut (Stripe SDK utilise la version stable
// compatible avec la version du package)
export const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO ?? "";

export const isStripeConfigured = !!stripe && !!STRIPE_PRICE_PRO;
