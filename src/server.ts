import http from "http";
import dns from "dns";
import createApp from "./app";
import { env } from "./config/env";

// Cette machine n'a pas de route IPv6 fonctionnelle : sans ce réglage, Node
// tente parfois de résoudre les hôtes distants (ex. Neon) en IPv6 en premier
// et échoue immédiatement, provoquant des erreurs Prisma P1001 aléatoires.
dns.setDefaultResultOrder("ipv4first");

const app = createApp();

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

export default server;
