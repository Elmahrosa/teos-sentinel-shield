import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config.js";
import * as activationModule from "./routes/activation.js";
import * as healthModule from "./routes/health.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const getRouter = (mod: any) => {
  return mod.router || mod.default || (typeof mod === "function" ? mod : null);
};

const activationRouter = getRouter(activationModule);
const healthRouter = getRouter(healthModule);

if (healthRouter) app.use("/health", healthRouter);
if (activationRouter) app.use("/activation", activationRouter);

app.listen(env.PORT, () => {
  console.log(`🚀 Gateway server running on http://localhost:${env.PORT}`);
});
