-- AssetForU Database Schema
-- Run this in your PostgreSQL / Supabase SQL editor

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100),
  email VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  kyc_status VARCHAR(20) DEFAULT 'pending', -- pending | verified | rejected
  role VARCHAR(20) DEFAULT 'user',          -- user | admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- OTP STORE (short-lived)
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_store(phone);

-- ============================================================
-- WALLETS
-- ============================================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(30) NOT NULL,          -- credit_purchase | store_purchase | campaign_access | refund
  amount NUMERIC(12, 2) NOT NULL,     -- INR amount paid
  credits NUMERIC(12, 2) NOT NULL,    -- credit units transacted
  direction VARCHAR(10) NOT NULL,     -- credit | debit
  description TEXT,
  reference_id VARCHAR(100),          -- Razorpay order / payment ID
  status VARCHAR(20) DEFAULT 'pending', -- pending | completed | failed
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_txn_user ON transactions(user_id);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  location VARCHAR(200),
  image_url TEXT,
  credit_price NUMERIC(12, 2) NOT NULL,
  total_slots INTEGER DEFAULT 100,
  filled_slots INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- active | closed | upcoming
  end_time TIMESTAMPTZ,
  badge VARCHAR(50),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PARTICIPATIONS (Campaign Access)
-- ============================================================
CREATE TABLE IF NOT EXISTS participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  credits_used NUMERIC(12, 2) NOT NULL,
  credits_purchased INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_part_user ON participations(user_id);
CREATE INDEX IF NOT EXISTS idx_part_campaign ON participations(campaign_id);

-- ============================================================
-- STORE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  type VARCHAR(50) NOT NULL,          -- service | product
  category VARCHAR(100),              -- legal | advisory | documentation | plants | home_items
  credit_cost NUMERIC(12, 2) NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  stock INTEGER DEFAULT -1,           -- -1 = unlimited
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS (Store purchases)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(30) DEFAULT 'pending',   -- pending | processing | completed | cancelled
  total_credits NUMERIC(12, 2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  store_item_id UUID NOT NULL REFERENCES store_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  credit_cost_each NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL
);

-- ============================================================
-- PAYMENT ORDERS (Razorpay)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(500),
  amount NUMERIC(12, 2) NOT NULL,   -- INR
  credits NUMERIC(12, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'created', -- created | paid | failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CART (ephemeral, could also be client-side only)
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  store_item_id UUID NOT NULL REFERENCES store_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, store_item_id)
);

-- ============================================================
-- SEED: Sample Campaigns
-- ============================================================
INSERT INTO campaigns (title, description, location, image_url, credit_price, total_slots, status, end_time, badge, is_featured)
VALUES
  ('Chennai Premium Plot Access', 'Gain eligibility to premium residential plots in Chennai''s high-growth corridors. Asset credits are usable across our services. Benefits are complimentary and no guaranteed allocation.', 'Chennai, Tamil Nadu', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgDKbrFC0Vg_7LTY1W-Nmsor_gtBp_knj8Dx7DTHK4E8F4nXb4RRtH7XA6laTuGl5XHKy4vEoL_-3F5pErmhKi2G7KVAOzLaC5oTS5pfTpDtmVPGE98RjqWinQOtM_sWxZk-KLVhOHPwRWDGq5OQqzs91ZfIwV1UtBhFE-4UGqvP22jsl_dgT-FjAocU7SoJ9_5EyYaePjZu071MRQ4oVHmmhzjw9O8gn8Qs-3KbUyFjYk6S0H9KHYSDQhVwR1L9YMSU8HvQCOudui', 300.00, 100, 'active', NOW() + INTERVAL '2 days', 'Hot Deal', true),
  ('Bangalore Elite Township', 'Explore eligibility for plots in Bangalore''s premium townships. Asset credits are usable across our services. Benefits are complimentary.', 'Bangalore, Karnataka', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnlaBwM7W-56ljAOW5zFECphDjRuuW4fSc4m8AcwSAQ_6UpPCRbmfO_so4uer7G-bdJ0oOdYyjvsME7M7n6JHib6AVXnWX2jXd8sC3Lmdyksg5MeUhq4uKZa6lzBzSeTJJpAxSS1PYcUrW9L3pKM-joVKxHT1MjWyHSsjcuLTXgH8hrecgQYkpAm3bUPrhq9HgEqzR9oJgJelXjmzpZv6WJoJlU9tR2UJCJpFeJLPjSJ8cf-GVOO2TOyo8X7lNopD0FPYh39_W0W1m', 500.00, 80, 'active', NOW() + INTERVAL '5 days', NULL, false),
  ('Hyderabad Heritage Lands', 'Access eligibility for culturally rich land in Hyderabad''s expanding zones. Benefits are complimentary and no guaranteed allocation.', 'Hyderabad, Telangana', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxQBvUf--3ezPKpZMIqbr_a3Z0rWM5la6EI5FTlzvVkrk4SCqSIEOghJG8LFg_F5aksKVut4IttwmrGN_9FC6WrdHX4vPmmVMQkKRwiDKVJ-4w7J37KXw8tcQnwlAF7A0UWykvXScWQ2HBX3RDd5SMts6RhZpRO33aw6ARvrXFGO0_-4Tmep6P3tD2uDcEHjRtiWwQRzU-kE8PNHZwqEdUMLQdhzPo9MjSusw3XatSDId0ozu-qNkEFjlsnzqCxUEPyWCv2r_OQMu4', 450.00, 60, 'active', NOW() + INTERVAL '10 days', NULL, false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Store Items
-- ============================================================
INSERT INTO store_items (title, description, image_url, type, category, credit_cost, is_popular)
VALUES
  ('Land Legal Consultation', 'Get verified legal opinions on land titles, disputes, and inheritance matters from senior advocates.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmEpPjIbRCtFD343HTnNzb8L0v0nVc6fyYEDJWgUmRh--Ie3wHuPyCsZEWNmGnaMh1DAb-Ba-3ieasS7CWsgIgP5sVygwnqm_1uOvKBMY_K0Bip1I2jXn86HCVDbELFRWfZ2RMvGL694q6HP_A8CyYTGb9U3YWpHM7UHWAOLAQK5JoSnuURT9dlzqTEbmRKIESvV7MUbx9R3BShn-h-Cq7-haoCHematQmlJocCmI-j4DJu_YD3mjsohsQQhg1d8M_Yyc1et0Z8kdM', 'service', 'legal', 300.00, true),
  ('Property Advisory', 'Expert guidance and analysis for high-yield real estate opportunities.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMMonaC8-FWx1AZIF4i6XUGOAOd4bdzsqz_6RbnHz1C2VOsr51IZcH_J_39EwMTEzE3TAoPXlwH3rYgpsvUUpv0tv0qwi_lpjvTOJYgW2r2EUDfvPWZfNaIX3MjVRPvA1c_7279pAmA4323_66dbdRUx_y2HDtioqWk--bEYXWXwoqs9IjZ134-nSUWs6ymde6UriqgULMUZGzf3DwEftDr4BKfHBbGWXEpqNdpXWS3TGCxqcFEe4UEwd6MiinSwnP4P1RrDpbyAMP', 'service', 'advisory', 500.00, false),
  ('Documentation Support', 'End-to-end assistance for registration, mutation, and verification of property documents.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCp6c6ibhcjAkDUHu97APPlyV8q9XsmVjsSRDRnfrzrjjeLMXwD_yFfaAbDTbEsU1WcLdCKYMQTEnsMB34E_SuK0Wyi6rChWsou49BhxaoQPe7qBfY7Yb-ZorET_ilE3WjvvC85JKe90UU2r6_uV0bZN4vdGLqz2KPWaYM7McbeyHVImNsXiA_DDDbdu2ca3EqpFq3pW3I9FCDx8z1QDI6KgBy0_73wL81cDm9K0Dy3PFeZpYFLZEROdzYCImICFMxYSOWLpLcQkQxv', 'service', 'documentation', 400.00, false),
  ('Indoor Air Plants', 'Premium curated indoor plants delivered to your property.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCr2BH2FAxQY4c1cC4Vq-YqnFSL-AsiMEYDPr4MvMfBooKCdeLfU1rAbwajDrvopg-zF9nWlNjB4LKqW2W0Zt3KSq8MckC6Bm0jIMohRFp9iSUEA43nXwtARnYsL5BS-3y8ceWWbaFUGXLJldUfzgrFAmWIQe6pAPnCNLzKo1F8bvdwBzXLHAYO5n-EsaFlS4xX3XVY_6fA0NodeAdNod5_HoGclcgFCzUN-3s2yf8oDBOd5jIQerpytQHe8WOqp9plkP7J689eal8k', 'product', 'plants', 150.00, false),
  ('Ceramic Vase Set', 'Minimalist modern ceramic decor set for your property.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvgGTgdzL4GU4a8Ce3iK71pt2M8ZAww1fZ0hzCwGiMcxsafVHUIdgsccig2cwzP-iAYs7FObOnr_Hp1i54qK1V9b33eGz4jU4LS8zSzvJ-9yTGsy_SavoPk6Z7rQ2kGVQvVqp-Gx7ha05yYAOyipDp2zNlpJIewotXez2wJ2wLcy7MeGlQkDLQfT9zAqOvcXxLSX7IiUxuTHUD5Xnxz41C_agcXLWIdoJ0YfPywfSd93KON6cMVGJ8TW0S67v0fdlwErQLYessCT3S', 'product', 'home_items', 850.00, false),
  ('Succulent Garden', 'Exotic succulent garden collection for indoor/outdoor spaces.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjyZ-O1MEbRdLsOcEikTlZ1lOvom-63oMYjJRt3oFUb2F3kXqA6dGnsq6s8ISmUeYYwOpz_Ya8mbxAJAvBJJGfhpkg3F2I6v868tiy8y2lwOGuG3gUGL7FZnOgQ1xLaenpi5Yb9YdoSzlZFyt2r5O1QVHQhZ5NPgTs2iGOtGwdlcew7mMXpvmBVaEtzItdmEWbhPvhqs3BPnlu5V73nzthX86OexH_SEKnijPP2jtM-zQRKjevTsUWVD0Dn-xQ2_Q3PmVTXrfDI86u', 'product', 'plants', 220.00, false),
  ('Smart Desk Lamp', 'Elegant smart desk lamp for your workspace.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuChBP8tHomb342emFbBJF27mxcJJCiGRLYrl59Hz3BG5YFJtBR1YCSK7wJ7tU9czo4ZGkz4fDS2F1q7jQ3LtCH3x-bcWMGweZrdwTeR-p-xQKHPfuGGfFTfyEkoJp0jxQAnZji8UuqKZhy9A0H8kLiCUJQH5x-UKLf_uxDyJaAX7Z8QV7zbjzyaI4-maf1RhPZrzEV7YoVO_XjbQ0W-qELimZOGMiJHb2NJ_rJFkoOP-9i657tt5ihRuhzXXIE08vwg-7Tgaz8mV9-O', 'product', 'home_items', 1200.00, false)
ON CONFLICT DO NOTHING;
