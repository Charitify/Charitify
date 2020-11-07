import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt"
import { Strategy as FacebookStrategy } from "passport-facebook"
import AuthService from "../services/auth"
import { User } from "../models"

// app.js will pass the global passport object here, and this function will configure it
export default function (passport) {
  // The JWT payload is passed into the verify callback

  passport.serializeUser(function (user, done) {
    done(null, user)
  })

  passport.deserializeUser(function (user, done) {
    done(null, user)
  })

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.SECRET,
        ignoreExpiration: false,
        jsonWebTokenOptions: {
          maxAge: process.env.TOKEN_EXPIRATION_PERIOD,
          ignoreExpiration: false,
        },
      },
      async (jwt_payload, done) => {
        try {
          const user = await User.findOne({ _id: jwt_payload.sub })
          if (user) return done(null, { ...user, token: jwt_payload })
          return done(null, false)
        } catch (error) {
          return done(error, false)
        }
      }
    )
  )

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/login/facebook",
        profileFields: [
          "id",
          "displayName",
          "photos",
          "email",
          "first_name",
          "last_name",
          "profileUrl",
        ],
      },
      async (accessToken, _, profile, done) => {
        try {
          const user = await AuthService.registerWithFacebook(
            accessToken,
            profile
          )
          if (user) return done(null, { ...user, token: jwt_payload })
          return done(null, false)
        } catch (error) {
          return done(error, false)
        }
      }
    )
  )
}
