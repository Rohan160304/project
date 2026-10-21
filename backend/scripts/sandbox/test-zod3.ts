import { z } from 'zod';
const schema = z.object({ currentLat: z.number().optional() });
try {
  schema.parse({ currentLat: NaN });
  console.log("Zod parsed NaN successfully!");
} catch (e) {
  console.log("Error:", JSON.stringify(e.errors));
}
