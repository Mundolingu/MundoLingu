import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema";

// Connection details are supplied by Netlify at runtime — no connection string needed.
export const db = drizzle({ schema });
