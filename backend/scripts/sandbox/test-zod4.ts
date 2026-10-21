import { z } from 'zod';
const schema = z.object({ dob: z.coerce.date().optional() });
try {
  const result = schema.parse({ dob: "not a date" });
  console.log("Zod passed!", result);
} catch (e) {
  console.log("Error:", JSON.stringify(e.errors));
}
