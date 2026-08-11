import { z } from "zod";

export const nineOneOneSchema = z.object({
  postal: z.string().min(1).max(20),
  type: z.enum(["civil", "emergency"]),
  priority: z.enum(["low", "medium", "high"]),
  description: z.string().min(1).max(500),
});

export const callIntakeSchema = z.object({
  id: z.string().optional(),
  status: z.string().min(1),
  type: z.string().optional(),
  origin: z.string().optional(),
  primaryUnitCallsign: z.string().optional(),
  title: z.string().min(1).max(200),
  panels: z.string().min(1),
  code: z.string().optional(),
  priority: z.string().optional(),
  postal: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  assignSelf: z.boolean().optional(),
});
