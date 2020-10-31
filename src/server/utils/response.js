export default {
    
    data(data) {
        return {
            error: false,
            data,
        }
    },

    error(error) {
        return {
            error: true,
            data: error.message
        }
    }
}