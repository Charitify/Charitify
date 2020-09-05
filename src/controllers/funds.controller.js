import * as responses from '../../static/mock'

export default new class {

    getFund(req, res) {
        console.log(req.params)
        res.json(responses.fund)
    }

    getFunds(req, res) {
        res.json(responses.funds)
    }
}