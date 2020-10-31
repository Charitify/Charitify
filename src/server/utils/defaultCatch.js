export default (error, res) => {
    console.error(error);
    res.status(400).json(response.error(error));
}