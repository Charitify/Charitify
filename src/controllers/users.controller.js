import * as responses from '../../static/mock'

export default new class {

    getUser(req, res) {
        console.log(req.params)
        res.json(responses.user)
    }

    getUsers(req, res) {
        res.json(responses.users)
    }
}