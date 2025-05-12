
-- Add Paystack-specific columns to the subscriptions table
ALTER TABLE IF EXISTS public.subscriptions
ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT,
ADD COLUMN IF NOT EXISTS paystack_card_signature TEXT,
ADD COLUMN IF NOT EXISTS paystack_plan_code TEXT,
ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT;

-- Drop Stripe-specific columns from the subscriptions table
ALTER TABLE IF EXISTS public.subscriptions
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id;

COMMENT ON TABLE public.subscriptions IS 'Stores user subscription information from Paystack';
