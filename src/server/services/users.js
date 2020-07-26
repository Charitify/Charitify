import { User } from "../models";

const getUsers = async () => {
  return User.find({});
};

const createUser = async (data) => {
  const res = await User.create(data);
  return res;
};

export default {
  getUsers,
  createUser,
};
