import { Router } from "express"
import { OrganizationController } from "../controllers"
import { isAuthed } from "../middlewares/auth"

const router = Router()

router.get("/:id", isAuthed, async (req, res, next) => {
  try {
    const { id } = req.params
    const data = await OrganizationController.getOrganization(id)
    return res.send(data)
  } catch (err) { next(err) }
})

router.put("/:id", isAuthed, async (req, res, next) => {
  try {
    const { body, params: { id } } = req
    const data = await OrganizationController.updateOrganization(id, body)
    return res.send(data)
  } catch (err) { next(err) }
})

router.delete("/:id", isAuthed, async (req, res, next) => {
  try {
    const { params: { id } } = req
    const data = await OrganizationController.removeOrganization(id)
    return res.send(data)
  } catch (err) { next(err) }
})

router.get("/", isAuthed, async (req, res, next) => {
  try {
    const { query } = req
    const data = await OrganizationController.getOrganizations({ query })
    return res.send(data)
  } catch (err) { next(err) }
})

router.post("/", isAuthed, async (req, res, next) => {
  try {
    const { body } = req
    const data = await OrganizationController.createOrganization(body)
    return res.send(data)
  } catch (err) { next(err) }
})

export default router
