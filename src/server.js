import sirv from "sirv";
import express from "express";
import compression from "compression";
import * as sapper from "@sapper/server";
import router from "./server/routes";
import morgan from "morgan";
import Logger from "@logger";
import passport from "passport";
import passportSetup from "./server/utils/passport";
import bodyParser from "body-parser";
import { APIError, response } from "./server/utils";

const logger = Logger.child({ namespace: "server" });

const { PORT, NODE_ENV, ENV } = process.env;
const dev = NODE_ENV === "development";

const app = express();

passportSetup(passport);

// This will initialize the passport object on every request
app.use(passport.initialize());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(response.modifyResponseData);

app.use("/api", router);

app.use(morgan("tiny", { stream: logger.winstonStream }));
app.use(APIError.clientErrorHandler);

app.use(
  "/",
  compression({ threshold: 0 }),
  sirv("static", { dev }),
  sapper.middleware()
);
  
app.listen(PORT, (err) => {
  logger.info(`Server is sunning on ${PORT} port in ${ENV} mode!`);
  if (err) logger.err("error", err);
});
