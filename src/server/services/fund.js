import { Fund } from "../models";

const getFunds = async () => {
  return Fund.find({});
};

const getFund = async (fundId) => {
  return Fund.find({ _id: fundId });
};

const createFund = async (data) => {
  const res = await Fund.create(data);
  return res;
};

export default {
  getFund,
  getFunds,
  createFund,
};
