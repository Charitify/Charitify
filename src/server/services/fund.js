import { Fund } from "../models";

const getFunds = async () => {
  return Fund.find({});
};

const createFund = async (data) => {
  const res = await Fund.create(data);
  return res;
};

export default {
  getFunds,
  createFund,
};
