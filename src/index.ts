import "dotenv/config";

import Fastify from "fastify";
const fastify = Fastify({
  logger: true,
});

fastify.get("/", async function handler() {
  return { hello: "world" };
});

try {
  await fastify.listen({ port: Number(process.env.PORT) });
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}
