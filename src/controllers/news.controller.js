import * as responses from '../../static/mock'

export default new class {

    getNews(req, res) {
        console.log(req.params)
        res.json(responses.recent_news)
    }

    getNewss(req, res) {
        console.log(req.params)
        res.json(responses.recent_news)
    }
}