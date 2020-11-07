import mongoose from "mongoose"
import { Organization } from "../models"

const getOrganizations = async ({ query } = {}) => {
  const { user_id, fund_id } = query || {}
  if (user_id) {
    return Organization.findOne({ user_id: new mongoose.Types.ObjectId(user_id) })
  }
  if (fund_id) {
    return Organization.findOne().where('funds_id').in([new mongoose.Types.ObjectId(fund_id)])
  }
  return Organization.find()
}

const getOrganization = async (id) => {
  return Organization.findById(id)
}

const createOrganization = async (data) => {
  return Organization.create(data)
}

const updateOrganization = async (id, data) => {
  return Organization.findByIdAndUpdate(id, data)
}

const removeOrganization = async (id) => {
  return Organization.findByIdAndRemove(id)
}

export default {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  removeOrganization,
}
