import * as responses from '../../static/mock'

export default new class {

    getOrganization(req, res) {
        console.log(req.params)
        res.json(responses.organization)
    }

    getOrganizations(req, res) {
        res.json(responses.organizations)
    }
}