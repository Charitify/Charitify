import { DonatorService } from "../services"

const getDonator = async (id) => {
  return DonatorService.getDonator(id)
}

const getDonators = async (options) => {
  return DonatorService.getDonators(options)
}

const createDonator = async (data) => {
  return DonatorService.createDonator(data)
}

const updateDonator = async (id, data) => {
  return DonatorService.updateDonator(id, data)
}

const removeDonator = async (id) => {
  return DonatorService.removeDonator(id)
}

export default {
  getDonator,
  getDonators,
  createDonator,
  updateDonator,
  removeDonator,
}
