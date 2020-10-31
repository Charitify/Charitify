import { FundService } from "../services";

const getFund = async (fundId) => {
  return FundService.getFund(fundId);
};

const getFunds = async () => {
  return FundService.getFunds();
};

const createFund = async (data) => {
  return FundService.createFund(data);
};

export default { getFund, getFunds, createFund };
