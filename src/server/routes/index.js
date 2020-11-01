import { Router } from "express";
import { APIError } from "../utils";
import AuthRouter from "./auth";
import UserRouter from "./users";
import OrganizationRouter from "./organizations";
import FundRouter from "./funds";
import DonatorRouter from "./donators";
import PetRouter from "./pets";
import ArticleRouter from "./articles";
import CommentRouter from "./comments";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/users", UserRouter);
router.use("/funds", FundRouter);
router.use("/organizations", OrganizationRouter);
router.use("/donators", DonatorRouter);
router.use("/pets", PetRouter);
router.use("/articles", ArticleRouter);
router.use("/comments", CommentRouter);

router.get("*", (req, res) => res.status(APIError.statusCodes.NOT_FOUND).send(APIError.NOT_FOUND()));

export default router;
