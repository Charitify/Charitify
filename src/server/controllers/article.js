import { ArticleService } from "../services";

const getArticle = async (id) => {
  return ArticleService.getArticle(id);
};

const getArticles = async () => {
  return ArticleService.getArticles();
};

const createArticle = async (data) => {
  return ArticleService.createArticle(data);
};

const updateArticle = async (id, data) => {
  return ArticleService.updateArticle(id, data);
};

const removeArticle = async (id) => {
  return ArticleService.removeArticle(id);
};

export default {
  getArticle,
  getArticles,
  createArticle,
  updateArticle,
  removeArticle,
};
