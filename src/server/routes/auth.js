import { Router } from "express";
import { AuthController } from "../controllers";
import { isAuthed } from "../middlewares/auth";
import { response, defaultCatch } from "../utils";
import passport from "passport";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const data = await AuthController.register(req.body);
    return res.send(response.data(data));
  } catch (error) {
    defaultCatch(error, res);
  }
});

router.post("/login", async (req, res) => {
  try {
    const data = await AuthController.login(req.body);
    return res.send(response.data(data));
  } catch (error) {
    defaultCatch(error, res);
  }
});

router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/login",
  passport.authenticate("facebook", { failureRedirect: "/login-failure" }),
  async (req, res) => {
    try {
      const data = AuthController.loginWithFacebook(req.user);
      return res.status(200).json(response.data(data));
    } catch (error) {
      defaultCatch(error, res);
    }
  }
);

router.get("/logout", isAuthed, async (req, res) => {
  try {
    await AuthController.logout(req.token);
    return res.status(200).json(response.data(data));
  } catch (error) {
    defaultCatch(error, res);
  }
});

export default router;
