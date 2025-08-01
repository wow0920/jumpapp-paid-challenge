import { config } from "dotenv";
config();

import express from "express";
import ViteExpress from "vite-express";
import routes from "./routes";

const PORT = Number(process.env.PORT || 3000);
const app = express();
app.use(express.json());

app.use("/api", routes);

ViteExpress.listen(app, PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
