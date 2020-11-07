import mongoose from "mongoose";
import { Donator } from "../models";

const getDonators = async ({ query } = {}) => {
  const { organization_id, fund_id } = query || {}
  if (organization_id) {
    return Donator.find().where('organizations_id').in([new mongoose.Types.ObjectId(organization_id)])
  }
  if (fund_id) {
    return Donator.find().where('funds_id').in([new mongoose.Types.ObjectId(fund_id)])
  }
  return Donator.find();
};

const getDonator = async (id) => {
  return Donator.findById(id);
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
  getDonators,
  getDonator,
  createDonator,
  updateDonator,
  removeDonator,
};
