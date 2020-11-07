import { CommentService } from "../services"

const getComment = async (id) => {
  return CommentService.getComment(id)
}

const getComments = async (options) => {
  return CommentService.getComments(options)
}

const createComment = async (data) => {
  return CommentService.createComment(data)
}

const updateComment = async (id, data) => {
  return CommentService.updateComment(id, data)
}

const removeComment = async (id) => {
  return CommentService.removeComment(id)
}

export default {
  getComment,
  getComments,
  createComment,
  updateComment,
  removeComment,
}
