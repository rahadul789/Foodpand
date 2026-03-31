const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { env } = require("./config/env");
const { router } = require("./routes");
const { notFoundHandler } = require("./common/middlewares/not-found");
const { errorHandler } = require("./common/middlewares/error-handler");

const app = express();

app.use(
  cors({
    origin: env.clientUrl === "*" ? true : env.clientUrl,
    credentials: true,
  }),
);
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
