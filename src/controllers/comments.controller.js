import * as responses from '../../static/mock'

export default new class {

    getComment(req, res) {
        console.log(req.params)
        res.json(responses.comments)
    }

    getComments(req, res) {
        console.log(req.params)
        res.json(responses.comments)
    }
}