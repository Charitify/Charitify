import { Router } from "express"
import { AuthController } from "../controllers"
import { isAuthed } from "../middlewares/auth"
import passport from "passport"

const router = Router()

router.post("/register", async (req, res, next) => {
  try {
    const data = await AuthController.register(req.body)
    return res.send(data)
  } catch (err) { next(err) }
})

router.post("/login", async (req, res, next) => {
  try {
    const data = await AuthController.login(req.body)
    return res.send(data)
  } catch (err) { next(err) }
})

router.get("/facebook", passport.authenticate("facebook"))

router.get(
  "/facebook/login",
  passport.authenticate("facebook", { failureRedirect: "/login-failure" }),
  async (req, res, next) => {
    try {
      const data = AuthController.loginWithFacebook(req.user)
      return res.status(200).json(data)
    } catch (err) { next(err) }
  }
)

router.get("/logout", isAuthed, async (req, res, next) => {
  try {
    await AuthController.logout(req.token)
    return res.status(200).json(data)
  } catch (err) { next(err) }
})

export default router
