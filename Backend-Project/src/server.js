const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const userRouter = require("./routes/user");
const groupRouter = require("./routes/group");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Capstone Project Management API");
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);
app.use("/api/group", groupRouter);

app.listen(port, () => {
  console.log(`Aplikasi berjalan di http://localhost:${port}`);
});