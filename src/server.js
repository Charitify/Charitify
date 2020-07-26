import dotenv from "dotenv";
dotenv.config();

import sirv from "sirv";
import express from "express";
import compression from "compression";
import * as sapper from "@sapper/server";
import session from "express-session";
import router from "./server/routes";
import morgan from "morgan";
import Logger from "@logger";
import bodyParser from "body-parser";

const logger = Logger.child({ namespace: "server" });

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === "development";

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(morgan("tiny", { stream: logger.winstonStream }));
app.use("/api", router);

app.use(
  "/",
  compression({ threshold: 0 }),
  sirv("static", { dev }),
  sapper.middleware(),
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

app.listen(PORT, (err) => {
  if (err) console.log("error", err);
});
