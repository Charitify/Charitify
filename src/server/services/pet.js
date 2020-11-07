import mongoose from "mongoose"
import { Pet } from "../models"

const getPets = async ({ query } = {}) => {
  const { fund_id } = query || {}
  if (fund_id) {
    return Pet.find({ fund_id: new mongoose.Types.ObjectId(fund_id) })
  }
  return Pet.find()
}

const getPet = async (id) => {
  return Pet.findById(id)
}

const createPet = async (data) => {
  return Pet.create(data)
}

const updatePet = async (id, data) => {
  return Pet.findByIdAndUpdate(id, data)
}

const removePet = async (id) => {
  return Pet.findByIdAndRemove(id)
}

export default {
  getPets,
  getPet,
  createPet,
  updatePet,
  removePet,
}
