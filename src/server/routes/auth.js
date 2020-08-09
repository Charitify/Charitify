import { Router } from "express";
import { AuthController } from "../controllers";
import passport from "passport";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const data = await AuthController.register(req.body);
    return res.send({
      err: false,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: true, data: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const data = await AuthController.login(req.body);
    return res.send({
      err: false,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: true, data: error.message });
  }
});

router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect(301, "/");
  }
);

export default router;