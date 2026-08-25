import express, { Express } from "express";
import cors from "cors";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import healthRoutes from "./routes/health.routes";

const createApp = (): Express => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api", healthRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
