import { z } from "zod";

export const CreatePageSchema = z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    content: z.string(),
    published: z.boolean().default(false)
});

export type CreatePageInput = z.infer<typeof CreatePageSchema>