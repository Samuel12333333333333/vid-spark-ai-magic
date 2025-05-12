
-- Add Paystack-specific columns to the subscriptions table
ALTER TABLE IF EXISTS public.subscriptions
ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT,
ADD COLUMN IF NOT EXISTS paystack_card_signature TEXT;

-- Remove Stripe-specific columns from the subscriptions table
-- We'll keep these for now but make them nullable
ALTER TABLE IF EXISTS public.subscriptions
ALTER COLUMN stripe_customer_id DROP NOT NULL,
ALTER COLUMN stripe_subscription_id DROP NOT NULL;

COMMENT ON TABLE public.subscriptions IS 'Stores user subscription information from Paystack';
