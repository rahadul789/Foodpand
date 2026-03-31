const path = require("node:path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
  });
});

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

module.exports = app;
