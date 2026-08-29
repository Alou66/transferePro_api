import express, { Express } from "express";
import cors from "cors";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import routes from "./routes";
import { env } from "./config/env";

const createApp = (): Express => {
  const app = express();

  app.use(cors({ origin: env.FRONTEND_URL }));
  app.use(express.json());

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
