import { Donator } from "../models";

const getDonator = async (id) => {
  return Donator.findById(id);
};

const getDonators = async () => {
  return Donator.find({});
};

const createDonator = async (data) => {
  return Donator.create(data);
};

const updateDonator = async (id, data) => {
  return Donator.findByIdAndUpdate(id, data);
};

const removeDonator = async (id) => {
  return Donator.findByIdAndRemove(id);
};

export default {
  getDonator,
  getDonators,
  createDonator,
  updateDonator,
  removeDonator,
};
