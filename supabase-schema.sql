-- ============================================================
-- CLIPFORGE SAAS — Script SQL à coller dans Supabase
-- Table Editor > SQL Editor > colle tout ça > Run
-- ============================================================

-- Table profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'unlimited')),
  videos_used INTEGER DEFAULT 0,
  videos_limit INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  upgraded_at TIMESTAMPTZ
);

-- Table paiements crypto
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  amount_usdc INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fonction pour incrémenter le compteur vidéos
CREATE OR REPLACE FUNCTION increment_videos_used(user_id UUID)
RETURNS void AS $$
  UPDATE profiles SET videos_used = videos_used + 1 WHERE id = user_id;
$$ LANGUAGE sql;

-- Row Level Security (chaque user voit seulement ses données)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users see own payments" ON payments FOR ALL USING (auth.uid() = user_id);
