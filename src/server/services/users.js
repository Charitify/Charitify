import { User } from "../models";

const getUser = async (id) => {
  return User.findById(id);
};

const getUsers = async () => {
  return User.find({});
};

const createUser = async (data) => {
  return User.create(data);
};

const updateUser = async (id, data) => {
  return User.findByIdAndUpdate(id, data);
};

const removeUser = async (id) => {
  return User.findByIdAndRemove(id);
};

export default {
  getUser,
  getUsers,
  createUser,
  updateUser,
  removeUser,
};
