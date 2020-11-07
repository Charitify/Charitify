import mongoose from "mongoose";
import { Fund } from "../models";

const getFunds = async ({ query } = {}) => {
  const { organization_id } = query || {}
  if (organization_id) {
    return Fund.find({ organization_id: new mongoose.Types.ObjectId(organization_id) })
  }
  return Fund.find();
};

const getFund = async (id) => {
  return Fund.findById(id);
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
  getFunds,
  getFund,
  createFund,
  updateFund,
  removeFund,
};
