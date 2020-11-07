import mongoose from "mongoose";
import { Article } from "../models";

const getArticles = async ({ query } = {}) => {
  const { organization_id } = query || {}
  if (organization_id) {
    return Article.find({ organization_id: new mongoose.Types.ObjectId(organization_id) })
  }
  return Article.find();
};

const getArticle = async (id) => {
  return Article.findById(id);
};

const createArticle = async (data) => {
  return Article.create(data);
};

const updateArticle = async (id, data) => {
  return Article.findByIdAndUpdate(id, data);
};

const removeArticle = async (id) => {
  return Article.findByIdAndRemove(id);
};

export default {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  removeArticle,
};
