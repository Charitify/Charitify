import { Article } from "../models";

const getArticle = async (id) => {
  return Article.findById(id);
};

const getArticles = async () => {
  return Article.find({});
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
  getArticle,
  getArticles,
  createArticle,
  updateArticle,
  removeArticle,
};
