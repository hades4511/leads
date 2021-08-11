const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const Admin = require('../models/admin');
const Lead = require('../models/lead');

const SignInRender = (res, token, error, email) => {
    return res.render('admin/login', {
        csrfToken: token,
        email: email,
        error: error,
    });
}

exports.SignIn = (req, res, next) => {
    return SignInRender(res, req.csrfToken(), '', '');
}

exports.Dashboard = async (req, res, next) => {
    const users = await Admin.getAllUsers()
    res.render('admin/index', {
        email: req.session.email,
        users: users,
    });
}

exports.SignInAction = (req, res, next) => {
    const errors = validationResult(req).array();
    const email = req.body.email;
    if(errors.length > 0){
        return SignInRender(res, req.csrfToken(), errors[0].msg, email);
    }
    const password = req.body.pass;
    Admin.findById(email)
    .then(admin => {
        if(!admin){
            return SignInRender(res, req.csrfToken(), 'Email not registered', email);
        }
        else return bcrypt.compare(password, admin.password)
    })
    .then(doMatch => {
        if(!doMatch){
            return SignInRender(res, req.csrfToken(), 'Incorrect Password', email);
        }
        req.session.email = email;
        req.session.isadmin = true;
        res.redirect('/admin');
    })
}

exports.Lead = (req, res, next) => {
    res.render('admin/createLead', {
        csrfToken: req.csrfToken(),
        from: '',
        to: '',
        subject: '',
        date: '',
        body: '',
        source: '',
        email: req.session.email,
    });
}

exports.LeadAction = (req, res, next) => {
    const to = req.body.to;
    const from = req.body.from;
    const date = new Date(req.body.date);
    const subject = req.body.subject;
    const source = req.body.source;
    const body = req.body.body;

    const lead = new Lead(to, from, subject, date, source, body);
    lead.insertLead();
    res.redirect('/admin');
}
