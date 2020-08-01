import crypto from "crypto";
import moment from "moment";
import jsonwebtoken from "jsonwebtoken";

import { User } from "../models";
import { userRoles } from "../config";

const login = async (user) => {
  const { username, password } = user;
  const dbUser = await User.findOne({ username }).select("hash salt username");

  if (!dbUser) throw new Error("Wrong username!");

  const isValid = validPassword(password, dbUser.hash, dbUser.salt);

  if (!isValid) throw new Error("Wrong password!");

  const { token, expiresIn } = issueJWT(dbUser);

  return {
    token,
    expiresIn,
  };
};

const register = async (user) => {
  const {
    username,
    fullname,
    sex,
    birthDate,
    email,
    tel,
    location,
    password,
  } = user;
  const { salt, hash } = genPassword(password);

  const userObj = new User({
    username,
    fullname,
    sex,
    birthDate: moment(birthDate),
    email,
    tel,
    location,
    role: userRoles.user,
    hash: hash,
    salt: salt,
  });
  let savedUser = await userObj.save();

  savedUser = savedUser.toJSON();
  delete savedUser.hash;
  delete savedUser.salt;

  return savedUser;
};

/**
 *
 * @param {*} password - The password string that the user inputs to the password field in the register form
 *
 * This function takes a plain text password and creates a salt and hash out of it.  Instead of storing the plaintext
 * password in the database, the salt and hash are stored for security
 *
 * ALTERNATIVE: It would also be acceptable to just use a hashing algorithm to make a hash of the plain text password.
 * You would then store the hashed password in the database and then re-hash it to verify later (similar to what we do here)
 */
function genPassword(password) {
  var salt = crypto.randomBytes(32).toString("hex");
  var genHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");

  return {
    salt: salt,
    hash: genHash,
  };
}

/**
 * @param {*} password - The plain text password
 * @param {*} hash - The hash stored in the database
 * @param {*} salt - The salt stored in the database
 *
 * This function uses the crypto library to decrypt the hash using the salt and then compares
 * the decrypted hash/salt with the password that the user provided at login
 */
function validPassword(password, hash, salt) {
  var hashVerify = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return hash === hashVerify;
}

/**
 * @param {*} user - The user object.  We need this to set the JWT `sub` payload property to the MongoDB user ID
 */
function issueJWT(user) {
  const _id = user._id;

  const expiresIn = "1d";

  const payload = {
    sub: _id,
    iat: Date.now(),
  };

  const signedToken = jsonwebtoken.sign(payload, process.env.SECRET, {
    expiresIn,
  });

  return {
    token: "Bearer " + signedToken,
    expires: expiresIn,
  };
}

export default {
  login,
  register,
};
