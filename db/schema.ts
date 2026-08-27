import { pgTable, uuid, text, boolean, integer, date, timestamp } from "drizzle-orm/pg-core";

// Opportunities shown to members in the hub: jobs, scholarships, volunteering, etc.
// Managed from the Opportunities admin screen.
export const opportunities = pgTable("opportunities", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  kind: text().notNull().default("Opportunity"),
  organisation: text(),
  location: text(),
  summary: text().notNull().default(""),
  body: text().notNull().default(""),
  applyUrl: text("apply_url"),
  deadline: date(),
  published: boolean().notNull().default(false),
  sort: integer().notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
