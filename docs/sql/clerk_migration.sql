-- Clerk migration helper (DO NOT RUN AUTOMATICALLY)
-- Purpose: Map legacy Supabase user IDs to Clerk user IDs by matching email.
-- Run per user after verifying the mapping. Replace placeholders accordingly.
-- Always back up before running.
--
-- Parameters to replace:
--   :legacy_user_id  -- the old Supabase user id
--   :clerk_user_id   -- the new Clerk user id (JWT sub)
--   :user_email      -- the user's primary email address
--
-- 1) Verify current mapping
SELECT id, email FROM profiles WHERE email = :user_email;

-- 2) Update the profiles row primary key and email to the Clerk identity
UPDATE profiles
SET id = :clerk_user_id, email = :user_email
WHERE id = :legacy_user_id OR email = :user_email;

-- 3) Update foreign-key-ish references across tables
UPDATE entities SET user_id = :clerk_user_id WHERE user_id = :legacy_user_id;
UPDATE workout_results SET user_id = :clerk_user_id WHERE user_id = :legacy_user_id;
UPDATE personal_records SET user_id = :clerk_user_id WHERE user_id = :legacy_user_id;
UPDATE ai_workout_feedback SET user_id = :clerk_user_id WHERE user_id = :legacy_user_id;
UPDATE social_interactions SET user_id = :clerk_user_id WHERE user_id = :legacy_user_id;
UPDATE gyms SET owner_id = :clerk_user_id WHERE owner_id = :legacy_user_id;
UPDATE gym_memberships SET user_id = :clerk_user_id WHERE user_id = :legacy_user_id;

-- 4) Optional: confirm
SELECT
  (SELECT COUNT(*) FROM entities WHERE user_id = :clerk_user_id) AS entities_moved,
  (SELECT COUNT(*) FROM workout_results WHERE user_id = :clerk_user_id) AS results_moved,
  (SELECT COUNT(*) FROM personal_records WHERE user_id = :clerk_user_id) AS prs_moved;

-- Notes:
-- - Ensure your Supabase JWT configuration accepts Clerk's "supabase" JWT template.
-- - RLS policies should continue to use auth.uid() and/or auth.jwt().email.
-- - For bulk migration, wrap updates in a transaction per user to avoid partial moves.

