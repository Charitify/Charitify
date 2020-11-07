import mongoose from "mongoose"
import { User } from "../models"

const getUsers = async () => {
  return User.find()
}

const getUser = async (id) => {
  return User.findById(id)
}

const createUser = async (data) => {
  return User.create(data)
}

const updateUser = async (id, data) => {
  return User.findByIdAndUpdate(id, data)
}

const removeUser = async (id) => {
  return User.findByIdAndRemove(id)
}

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  removeUser,
}
