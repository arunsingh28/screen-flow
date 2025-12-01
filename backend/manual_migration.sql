-- Manual SQL migration for referral program
-- Run this directly in the database

-- Create enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE referral_status_enum AS ENUM ('PENDING', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id),
    referred_user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    status referral_status_enum NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_referrals_id ON referrals(id);

-- Add referral_code to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR;
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_referral_code ON users(referral_code);

-- Add REFERRAL_BONUS to credit_txn_type_final enum
ALTER TYPE credit_txn_type_final ADD VALUE IF NOT EXISTS 'REFERRAL_BONUS';
