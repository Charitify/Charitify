import { Organization } from "../models";

const getOrganizations = async () => {
  return Organization.find({});
};

const createOrganization = async (data) => {
  const res = await Organization.create(data);
  return res;
};

export default {
  getOrganizations,
  createOrganization,
};
