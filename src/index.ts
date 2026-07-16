import express from "express";

const app = express();
const PORT = 5001;

app.get("/", (_, res) => {
  res.send("TWP backend is running");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
