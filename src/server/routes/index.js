import { Router } from "express";
const router = Router();
import UserRouter from "./users";
import AuthRouter from "./auth";

router.use("/users", UserRouter);
router.use("/auth", AuthRouter);
router.use("/funds", UserRouter);
router.use("/organization", UserRouter);
router.use("/media", UserRouter);
router.use("/donator", UserRouter);
router.use("/news", UserRouter);
router.use("/comment", UserRouter);

export default router;
