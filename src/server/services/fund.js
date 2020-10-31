import { Fund } from "../models";

const getFund = async (id) => {
  return Fund.findById(id);
};

const getFunds = async () => {
  return Fund.find({});
};

const createFund = async (data) => {
  return Fund.create(data);
};

const updateFund = async (id, data) => {
  return Fund.findByIdAndUpdate(id, data);
};

const removeFund = async (id) => {
  return Fund.findByIdAndRemove(id);
};

export default {
  getFund,
  getFunds,
  createFund,
  updateFund,
  removeFund,
};
