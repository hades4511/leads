exports.get404 = (req, res, next) => {
    res.render('404');
}

exports.get500 = (req, res, next) => {
    res.status(500).render('404');
}
