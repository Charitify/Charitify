import { Router } from "express";
import AuthRouter from "./auth";
import UserRouter from "./users";
import OrganizationRouter from "./organizations";
import FundRouter from "./funds";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/users", UserRouter);
router.use("/funds", FundRouter);
router.use("/organizations", OrganizationRouter);
router.use("/media", UserRouter);
router.use("/donator", UserRouter);
router.use("/news", UserRouter);
router.use("/comment", UserRouter);

export default router;
