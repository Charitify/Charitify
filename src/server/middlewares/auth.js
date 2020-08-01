import passport from "passport";

export const isAuthed = passport.authenticate("jwt", { session: false });
