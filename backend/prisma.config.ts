// import { defineConfig } from "prisma/config"

// export default defineConfig({
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL!,
//     },
//   },
// })

export default {
  schema: "prisma/schema.prisma",
  datasource: {
	url: process.env.DATABASE_URL,
  },
};