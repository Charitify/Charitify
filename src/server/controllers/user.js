import { UserService } from "../services"

const getUser = async (id) => {
  return UserService.getUser(id)
}

const getUsers = async (options) => {
  return UserService.getUsers(options)
}

const createUser = async (data) => {
  return UserService.createUser(data)
}

const updateUser = async (id, data) => {
  return UserService.updateUser(id, data)
}

const removeUser = async (id) => {
  return UserService.removeUser(id)
}

export default {
  getUser,
  getUsers,
  createUser,
  updateUser,
  removeUser,
}
