import { z } from "zod";

export const programSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  description: z.string().optional(),
  duration_weeks: z
    .number()
    .min(1, "Duration must be at least 1 week")
    .max(8, "Duration cannot exceed 8 weeks"),
  client_id: z.string().min(1, "Please select a client or class"),
});

export type ProgramInput = z.infer<typeof programSchema>;

export const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email address"),
  notes: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
