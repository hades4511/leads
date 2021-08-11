module.exports = (req, res, next) =>{
    if(!req.session.email){
        return res.redirect('/signin');
    }
    next();
}
