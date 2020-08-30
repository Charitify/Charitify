import passport from "passport";
import { ExpiredToken } from "../models";

const isAuthed = (req, res, next) =>
  passport.authenticate("jwt", { session: false }, async (err, user) => {
    if (err || !user)
      return res.status(401).json({ error: true, data: "Token expired!" });

    const token = req.headers.authorization.split("Bearer ")[1];
    const isExpired = await ExpiredToken.findOne({ token });

    if (isExpired) {
      res.status(401).json({ error: true, data: "Token expired!" });
    }

    console.log({ isExpired, token });

    req.token = token;
    return next();
  })(req, res);

export { isAuthed };
