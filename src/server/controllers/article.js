import { ArticleService } from "../services";

const getArticle = async (id) => {
  return ArticleService.getPet(id);
};

const getArticles = async () => {
  return ArticleService.getPets();
};

const createArticle = async (data) => {
  return ArticleService.createPet(data);
};

const updateArticle = async (id, data) => {
  return ArticleService.updatePet(id, data);
};

const removeArticle = async (id) => {
  return ArticleService.removePet(id);
};

export default {
  getArticle,
  getArticles,
  createArticle,
  updateArticle,
  removeArticle,
};
