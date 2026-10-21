import { z } from 'zod';

export const createEventHallSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().optional().nullable(),
  roomCount: z.number().default(0),
  foodAvailable: z.boolean().default(false),
  facilities: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().default(true)
});

export const updateEventHallSchema = createEventHallSchema.partial();
