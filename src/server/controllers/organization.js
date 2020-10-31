import { OrganizationService } from "../services";

const getOrganization = async (orgId) => {
  return OrganizationService.getOrganization(orgId);
};

const getOrganizations = async () => {
  return OrganizationService.getOrganizations();
};

const createOrganization = async (data) => {
  return OrganizationService.createOrganization(data);
};

export default { getOrganization, getOrganizations, createOrganization };
