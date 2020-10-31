import { Organization } from "../models";

const getOrganization = async (id) => {
  return Organization.findById(id);
};

const getOrganizations = async () => {
  return Organization.find({});
};

const createOrganization = async (data) => {
  return Organization.create(data);
};

const updateOrganization = async (id, data) => {
  return Organization.findByIdAndUpdate(id, data);
};

const removeOrganization = async (id) => {
  return Organization.findByIdAndRemove(id);
};

export default {
  getOrganization,
  getOrganizations,
  createOrganization,
  updateOrganization,
  removeOrganization,
};
