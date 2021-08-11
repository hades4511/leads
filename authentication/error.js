module.exports = (err, code) => {
    const error = new Error(err);
    error.httpStatusCode = code;
    return next(error);
}
