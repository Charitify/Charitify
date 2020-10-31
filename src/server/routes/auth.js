import { Router } from "express";
import { AuthController } from "../controllers";
import { isAuthed } from "../middlewares/auth";
import errorResponse from "../utils/errorResponse";
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
    res.status(400).json(errorResponse(error));
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
    res.status(400).json(errorResponse(error));
  }
});

router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/login",
  passport.authenticate("facebook", { failureRedirect: "/login-failure" }),
  async (req, res) => {
    try {
      const data = AuthController.loginWithFacebook(req.user);

      return res.status(200).json({
        error: null,
        data,
      });
    } catch (error) {
      console.error(error);
      res.status(400).json(errorResponse(error));
    }
  }
);

router.get("/logout", isAuthed, async (req, res) => {
  try {
    await AuthController.logout(req.token);
    return res.status(200).json({
      error: null,
      data: true,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json(errorResponse(error));
  }
});

export default router;
