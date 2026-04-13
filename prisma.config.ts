import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // DIRECT_URL is used for migrations (direct Neon connection, bypasses pooler)
    // DATABASE_URL is used at runtime (pooled connection via Neon's connection pooler)
    url: env('DIRECT_URL') ?? env('DATABASE_URL'),
  },
})
 