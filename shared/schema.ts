import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  coins: integer("coins").notNull().default(10000), // Start with 10k
  freeSpins: integer("free_spins").notNull().default(0),
});

export const spins = pgTable("spins", {
  id: serial("id").primaryKey(),
  result: text("result").notNull(),
  coinDelta: integer("coin_delta").notNull().default(0),
  freeSpinDelta: integer("free_spin_delta").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSpinSchema = createInsertSchema(spins).omit({ id: true, createdAt: true });

export type Spin = typeof spins.$inferSelect;
export type InsertSpin = z.infer<typeof insertSpinSchema>;
export type User = typeof users.$inferSelect;
