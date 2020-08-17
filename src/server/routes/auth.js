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
  "/facebook/login",
  passport.authenticate("facebook", { failureRedirect: "/login-failure" }),
  async (req, res) => {
    try {
      console.log(req.user);
      const data = AuthController.loginWithFacebook(req.user);

      return res.status(200).json({
        error: null,
        data,
      });
    } catch (err) {
      console.error(error);
      res.status(400).json({ error: true, data: error.message });
    }
  }
);

router.get("/logout", (req, res) => {});

export default router;
