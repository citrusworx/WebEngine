import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().optional(),
  WPURL: z.string().optional()
});

export const env = EnvSchema.parse(process.env);
