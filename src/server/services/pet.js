import { Pet } from "../models";

const getPet = async (id) => {
  return Pet.findById(id);
};

const getPets = async () => {
  return Pet.find({});
};

const createPet = async (data) => {
  return Pet.create(data);
};

const updatePet = async (id, data) => {
  return Pet.findByIdAndUpdate(id, data);
};

const removePet = async (id) => {
  return Pet.findByIdAndRemove(id);
};

export default {
  getPet,
  getPets,
  createPet,
  updatePet,
  removePet,
};
