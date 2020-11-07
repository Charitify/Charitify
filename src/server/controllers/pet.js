import { PetService } from "../services"

const getPet = async (id) => {
  return PetService.getPet(id)
}

const getPets = async (options) => {
  return PetService.getPets(options)
}

const createPet = async (data) => {
  return PetService.createPet(data)
}

const updatePet = async (id, data) => {
  return PetService.updatePet(id, data)
}

const removePet = async (id) => {
  return PetService.removePet(id)
}

export default {
  getPet,
  getPets,
  createPet,
  updatePet,
  removePet,
}
