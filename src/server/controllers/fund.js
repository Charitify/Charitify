import { FundService } from "../services";

const getFunds = async () => {
  return FundService.getFunds();
};

const createFund = async (data) => {
  return FundService.createFund(data);
};

export default { getFunds, createFund };
