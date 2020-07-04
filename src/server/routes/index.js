import { Router } from "express";
const router = Router();
import UserRouter from "./users";

router.use("/users", UserRouter);
router.use("/pet", UserRouter);
router.use("/funds", UserRouter);
router.use("/organization", UserRouter);
router.use("/media", UserRouter);
router.use("/donator", UserRouter);
router.use("/news", UserRouter);
router.use("/comment", UserRouter);

export default router;
