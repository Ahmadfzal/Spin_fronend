import { z } from 'zod';

export const insertSpinSchema = z.object({
  result: z.string(),
  coinDelta: z.number().optional(),
  freeSpinDelta: z.number().optional(),
});

export const api = {
  spins: {
    create: {
      method: 'POST' as const,
      path: '/api/spins',
      input: insertSpinSchema,
      responses: {
        201: z.any(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/spins',
      responses: {
        200: z.array(z.any()),
      },
    },
  },
};
