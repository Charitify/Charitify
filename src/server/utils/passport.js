import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { User } from "../models";

// At a minimum, you must pass the `jwtFromRequest` and `secretOrKey` properties
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET,
};

// app.js will pass the global passport object here, and this function will configure it
export default function (passport) {
  // The JWT payload is passed into the verify callback
  passport.use(
    new JwtStrategy(options, async (jwt_payload, done) => {
      try {
        const user = await User.findOne({ _id: jwt_payload.sub });
        if (user) return done(null, user);
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    })
  );
}
