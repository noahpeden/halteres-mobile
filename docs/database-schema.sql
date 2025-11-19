-- Halteres Database Schema
-- Generated from Supabase production database
-- Last updated: 2025-09-15

-- ==============================================
-- ENUMS
-- ==============================================

CREATE TYPE entity_type AS ENUM ('CLIENT', 'CLASS');
CREATE TYPE subscription_status_enum AS ENUM ('trialing', 'active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired');
CREATE TYPE subscription_plan_enum AS ENUM ('monthly', 'quarterly', 'annual', 'daily');

-- ==============================================
-- TABLES
-- ==============================================

-- AI Recommendations Table
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid,
  entity_id uuid,
  generated_at timestamp with time zone DEFAULT now(),
  recommendation_type text,
  recommendation_data jsonb,
  PRIMARY KEY (id)
);

-- Entities Table (Clients/Classes)
CREATE TABLE IF NOT EXISTS public.entities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  description jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  type entity_type NOT NULL,
  bench_1rm numeric,
  deadlift_1rm numeric,
  squat_1rm numeric,
  mile_time interval,
  gender text,
  height_cm integer,
  weight_kg numeric,
  recovery_score integer DEFAULT 100,
  preferred_training_days jsonb DEFAULT '{}'::jsonb,
  injury_history jsonb DEFAULT '{}'::jsonb,
  age integer,
  years_of_experience numeric(3,1),
  workout_experience_type text,
  deleted_at timestamp with time zone,
  PRIMARY KEY (id)
);

-- External Workouts Table (with split embeddings)
CREATE TABLE IF NOT EXISTS public.external_workouts (
  id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text,
  body text,
  embedding_part1 vector,
  embedding_part2 vector,
  tags jsonb DEFAULT '[]'::jsonb,
  difficulty text DEFAULT 'Intermediate'::text,
  PRIMARY KEY (id)
);

-- External Workouts New Table (with single embedding)
CREATE TABLE IF NOT EXISTS public.external_workouts_new (
  id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text,
  body text,
  embedding vector,
  tags jsonb DEFAULT '[]'::jsonb,
  difficulty text DEFAULT 'Intermediate'::text,
  PRIMARY KEY (id)
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  stripe_customer_id text,
  subscription_status subscription_status_enum,
  free_generations_used integer DEFAULT 0,
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_end timestamp with time zone,
  subscription_plan subscription_plan_enum,
  trial_start_date timestamp with time zone,
  trial_end_date timestamp with time zone,
  generations_remaining integer DEFAULT 15,
  generations_today integer DEFAULT 0,
  last_generation_date date,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (id)
);

-- Program Workouts Table
CREATE TABLE IF NOT EXISTS public.program_workouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  program_id uuid,
  entity_id uuid,
  title text NOT NULL,
  body text,
  workout_type text,
  difficulty text,
  tags jsonb,
  scheduled_date timestamp with time zone,
  completed boolean DEFAULT false,
  notes text,
  external_workout_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_reference boolean DEFAULT false,
  completed_at timestamp with time zone,
  PRIMARY KEY (id)
);

-- Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  entity_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  duration_weeks integer NOT NULL,
  focus_area text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  session_details jsonb,
  program_overview jsonb,
  workout_format jsonb,
  gym_details jsonb,
  generated_program jsonb,
  calendar_data jsonb DEFAULT '{}'::jsonb,
  periodization jsonb DEFAULT '{}'::jsonb,
  difficulty character varying(50),
  goal character varying(50),
  training_methodology text,
  reference_input text,
  PRIMARY KEY (id)
);

-- Workout Schedule Table
CREATE TABLE IF NOT EXISTS public.workout_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid,
  entity_id uuid,
  workout_id uuid,
  scheduled_date timestamp with time zone NOT NULL,
  notes text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- ==============================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================

ALTER TABLE public.ai_recommendations
  ADD CONSTRAINT ai_recommendations_entity_id_fkey
  FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE public.ai_recommendations
  ADD CONSTRAINT ai_recommendations_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

ALTER TABLE public.entities
  ADD CONSTRAINT entities_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.program_workouts
  ADD CONSTRAINT program_workouts_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

ALTER TABLE public.program_workouts
  ADD CONSTRAINT program_workouts_entity_id_fkey
  FOREIGN KEY (entity_id) REFERENCES public.entities(id);

ALTER TABLE public.program_workouts
  ADD CONSTRAINT program_workouts_external_workout_id_fkey
  FOREIGN KEY (external_workout_id) REFERENCES public.external_workouts(id);

ALTER TABLE public.programs
  ADD CONSTRAINT programs_entity_id_fkey
  FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE public.workout_schedule
  ADD CONSTRAINT workout_schedule_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

ALTER TABLE public.workout_schedule
  ADD CONSTRAINT workout_schedule_entity_id_fkey
  FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;

ALTER TABLE public.workout_schedule
  ADD CONSTRAINT workout_schedule_workout_id_fkey
  FOREIGN KEY (workout_id) REFERENCES public.program_workouts(id) ON DELETE CASCADE;

-- ==============================================
-- INDEXES
-- ==============================================

CREATE INDEX idx_entities_user_id ON public.entities USING btree (user_id);
CREATE INDEX idx_entities_deleted_at ON public.entities USING btree (deleted_at);
CREATE UNIQUE INDEX profiles_stripe_customer_id_key ON public.profiles USING btree (stripe_customer_id);
CREATE UNIQUE INDEX profiles_stripe_subscription_id_key ON public.profiles USING btree (stripe_subscription_id);
CREATE INDEX idx_program_workouts_program_id ON public.program_workouts USING btree (program_id);
CREATE INDEX idx_program_workouts_entity_id ON public.program_workouts USING btree (entity_id);
CREATE INDEX idx_program_workouts_scheduled_date ON public.program_workouts USING btree (scheduled_date);
CREATE INDEX idx_program_workouts_completed ON public.program_workouts USING btree (completed);
CREATE INDEX idx_programs_entity_id ON public.programs USING btree (entity_id);