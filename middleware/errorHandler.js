const { logEvents } = require('./logEvents');
//handles errors as they occur, logging to logEvents file
const errorHandler = (err, req, res, next) => {
    logEvents(`${err.name}: ${err.message}`, 'errLog.txt');
    console.error(err.stack)
    res.status(500).send(err.message);
};

module.exports = errorHandler;