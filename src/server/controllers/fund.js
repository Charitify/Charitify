import { FundService } from "../services"

const getFund = async (id) => {
  return FundService.getFund(id)
}

const getFunds = async (options) => {
  return FundService.getFunds(options)
}

const createFund = async (data) => {
  return FundService.createFund(data)
}

const updateFund = async (id, data) => {
  return FundService.updateFund(id, data)
}

const removeFund = async (id) => {
  return FundService.removeFund(id)
}

export default {
  getFund,
  getFunds,
  createFund,
  updateFund,
  removeFund,
}
