import { OrganizationService } from "../services";

const getOrganizations = async () => {
  return OrganizationService.getOrganizations();
};

const createOrganization = async (data) => {
  return OrganizationService.createOrganization(data);
};

export default { getOrganizations, createOrganization };
