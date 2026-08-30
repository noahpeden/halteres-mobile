import { z } from "zod";

export const programSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  description: z.string().optional(),
  duration_weeks: z
    .number()
    .min(1, "Duration must be at least 1 week")
    .max(52, "Duration cannot exceed 52 weeks"),
  client_id: z.string().min(1, "Please select a client or class"),
  gym_id: z.string().optional().nullable(),
  // Optional intake fields for bespoke program creation
  difficulty: z.string().optional(), // experience level
  goal: z.string().optional(),
  training_methodology: z.string().optional(),
  recent_training_history: z.string().optional(),
  program_influences: z.string().optional(),
  equipment: z.array(z.number()).optional(),
  gym_type: z.string().optional(),
  days_of_week_names: z.array(z.string()).optional(),
  session_duration_minutes: z.number().optional(),
});

export type ProgramInput = z.infer<typeof programSchema>;

export const entityTypeEnum = z.enum(["CLIENT", "CLASS"]);

export const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: entityTypeEnum.default("CLIENT"),
  notes: z.string().optional(),
});

export type EntityType = z.infer<typeof entityTypeEnum>;
export type ClientInput = z.infer<typeof clientSchema>;
