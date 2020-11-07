import mongoose from "mongoose"
import { Comment } from "../models"

const getComments = async ({ query } = {}) => {
  const { organization_id, fund_id } = query || {}
  if (organization_id) {
    return Comment.find({ organization_id: new mongoose.Types.ObjectId(organization_id) })
  }
  if (fund_id) {
    return Comment.find({ fund_id: new mongoose.Types.ObjectId(fund_id) })
  }
  return Comment.find()
}

const getComment = async (id) => {
  return Comment.findById(id)
}

const createComment = async (data) => {
  return Comment.create(data)
}

const updateComment = async (id, data) => {
  return Comment.findByIdAndUpdate(id, data)
}

const removeComment = async (id) => {
  return Comment.findByIdAndRemove(id)
}

export default {
  getComments,
  getComment,
  createComment,
  updateComment,
  removeComment,
}
