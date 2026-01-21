import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertSpin } from "@shared/routes";

// GET /api/spins
export function useSpins() {
  return useQuery({
    queryKey: [api.spins.list.path],
    queryFn: async () => {
      const res = await fetch(api.spins.list.path);
      if (!res.ok) throw new Error("Failed to fetch spins history");
      return api.spins.list.responses[200].parse(await res.json());
    },
  });
}

// POST /api/spins
export function useCreateSpin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertSpin) => {
      const res = await fetch(api.spins.create.path, {
        method: api.spins.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save spin result");
      return api.spins.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.spins.list.path] });
    },
  });
}
