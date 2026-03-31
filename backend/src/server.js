const http = require("node:http");

const { app } = require("./app");
const { env } = require("./config/env");
const { connectDatabase } = require("./config/database");
const { initSocket } = require("./realtime/socket");

async function bootstrap() {
  try {
    await connectDatabase();
    const server = http.createServer(app);
    initSocket(server);

    server.listen(env.port, () => {
      console.log(`Backend listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("[bootstrap] Failed to start backend", error);
    process.exit(1);
  }
}

bootstrap();
