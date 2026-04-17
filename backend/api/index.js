const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const ENV = require("../src/configs/env");
const { connectToDB } = require("../src/configs/db");
const authRouter = require("../src/routes/auth.route");
const profileRouter = require("../src/routes/profile.route");
const booksRouter = require("../src/routes/books.route");
const aiRouter = require("../src/routes/ai.route");
const exportsRouter = require("../src/routes/exports.route");

const app = express();

let dbConnected = false;

app.use(async (req, res, next) => {
  if (!dbConnected) {
    await connectToDB();
    dbConnected = true;
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ENV.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/books", booksRouter);
app.use("/api/ai", aiRouter);
app.use("/api/exports", exportsRouter);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use((err, _, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size too large! Max 2MB allowed." });
    }
    return res.status(400).json({ error: err.message });
  }
  return next(err);
});

app.use((err, _, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({
    error: "Something went wrong!",
    ...(ENV.NODE_ENV === "development" && { details: err.message }),
  });
});

module.exports = app;
