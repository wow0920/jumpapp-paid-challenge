import "dotenv/config";
import express from "express";
import ViteExpress from "vite-express";
import routes from "./routes";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

const PORT = Number(process.env.PORT || 3000);
const app = express();
app.use(cors({ credentials: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

ViteExpress.listen(app, PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
