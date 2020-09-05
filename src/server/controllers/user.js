import { UserService } from "../services";

const getUsers = async () => {
  return UserService.getUsers();
};

const createUser = async (data) => {
  return UserService.createUser(data);
};

export default { getUsers, createUser };
