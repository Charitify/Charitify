import { OrganizationService } from "../services";

const getOrganization = async (id) => {
  return OrganizationService.getOrganization(id);
};

const getOrganizations = async (options) => {
  return OrganizationService.getOrganizations(options);
};

const createOrganization = async (data) => {
  return OrganizationService.createOrganization(data);
};

const updateOrganization = async (id, data) => {
  return OrganizationService.updateOrganization(id, data);
};

const removeOrganization = async (id) => {
  return OrganizationService.removeOrganization(id);
};

export default {
  getOrganization,
  getOrganizations,
  createOrganization,
  updateOrganization,
  removeOrganization,
};
