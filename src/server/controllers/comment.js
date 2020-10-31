import { CommentService } from "../services";

const getComment = async (id) => {
  return CommentService.getComment(id);
};

const getComments = async () => {
  return CommentService.getComments();
};

const createComment = async (data) => {
  return CommentService.createComment(data);
};

const updateComment = async (id, data) => {
  return CommentService.updateComment(id, data);
};

const removeComment = async (id) => {
  return CommentService.removeComment(id);
};

export default {
  getComment,
  getComments,
  createComment,
  updateComment,
  removeComment,
};
