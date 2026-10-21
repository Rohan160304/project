import { z } from 'zod';

const schema = z.object({
  motherTongue: z.preprocess((val) => (val === '' ? undefined : val), z.string({ required_error: 'Required' }).min(1, 'Required')),
});

const partialSchema = schema.partial();

const result = partialSchema.safeParse({ motherTongue: "" });
console.log(JSON.stringify(result, null, 2));

const result2 = partialSchema.safeParse({});
console.log("No field:", JSON.stringify(result2, null, 2));
