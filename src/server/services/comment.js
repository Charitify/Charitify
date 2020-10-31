import { Comment } from "../models";

const getComment = async (id) => {
  return Comment.findById(id);
};

const getComments = async () => {
  return Comment.find({});
};

const createComment = async (data) => {
  return Comment.create(data);
};

const updateComment = async (id, data) => {
  return Comment.findByIdAndUpdate(id, data);
};

const removeComment = async (id) => {
  return Comment.findByIdAndRemove(id);
};

export default {
  getComment,
  getComments,
  createComment,
  updateComment,
  removeComment,
};
