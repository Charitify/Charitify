import APIError from './errorAPI'

export default class ResponseHandler {
    
    static data(data) {
        return {
            error: null,
            data,
        }
    }

    static error(error) {
        return {
            error,
            data: null
        }
    }

    static modifyResponseData(req, res, next) {
        const jsonRaw = res.json
        res.jsonRaw = jsonRaw
        res.json = function (data) {
            if (!APIError.isTrustedError(data)) {
                arguments[0] = ResponseHandler.data(arguments[0])
            } else {
                arguments[0] = ResponseHandler.error(arguments[0])
            }
            jsonRaw.apply(res, arguments)
        }
        next()
    }
}