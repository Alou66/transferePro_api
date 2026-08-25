import http from "http";
import createApp from "./app";
import { env } from "./config/env";

const app = createApp();

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

export default server;
