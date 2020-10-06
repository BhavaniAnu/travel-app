module.exports = fn => {  // instead of try catch we use this code, it executes function when called and in case of rejections it catches errors and passes to next() which sends error to globalErrorHandle middleware
    return (req, res, next) => {
        fn(req, res, next).catch(next); 
    };
};