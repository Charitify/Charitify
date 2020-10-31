import { Organization } from "../models";

const getOrganizations = async () => {
  return Organization.find({});
};

const getOrganization = async (orgId) => {
  return Organization.find({ _id: orgId });
};

const createOrganization = async (data) => {
  const res = await Organization.create(data);
  return res;
};

export default {
  getOrganization,
  getOrganizations,
  createOrganization,
};
