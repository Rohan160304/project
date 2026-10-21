import { z } from 'zod';
const schema = z.object({
  emergencyContact: z.object({
    name: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(1, 'Required')),
  }).optional()
}).partial();

try {
  schema.parse({ emergencyContact: { name: "" } });
  console.log("Passed!");
} catch (e) {
  console.log("Error:", JSON.stringify(e.errors));
}
