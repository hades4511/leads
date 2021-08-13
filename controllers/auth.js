const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const transport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const User = require('../models/user')
const throwerror = require('../authentication/error');

const transporter = nodemailer.createTransport(transport({
    auth: {
        api_key: process.env.SENDGRID_KEY,
    }
}));

const SignUpRender = (res, token, error, name, email) => {
    console.log('signup render');
    return res.render('sign-up',{
        csrfToken: token,
        error: error,
        name: name,
        email: email,
    });
}

const SignInRender = (res, token, error, email) => {
    console.log('signin render');
    return res.render('login',{
        csrfToken: token,
        error: error,
        email: email,
    });
}

exports.SignIn = (req, res, next) => {0
    console.log(req.session.email);
    if(req.session.email){
        return res.redirect('/');
    }
    return SignInRender(res, req.csrfToken(), '', '', '');
}

exports.SignUp = (req, res, next) => {
    console.log('signup')
    return SignUpRender(res, req.csrfToken(), '', '', '', '');
}

exports.PasswordChange = (req, res, next) => {
    res.render('reset-password', {csrfToken: req.csrfToken(), err: '', email: ''});
}

exports.PasswordChangeAction = (req, res, next) => {
    const email = req.body.email;
    let token;
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err);
            return res.redirect('/passwordchange');
        }
        token = buffer.toString('hex');
        User.findById(email)
        .then(user => {
            if(!user){
                return res.render('reset-password', {
                    csrfToken: req.csrfToken(), 
                    err: 'No User with this email found',
                    email: email,
                });
            }
            console.log('b');
            user.token = token;
            user.tokenExpiry = Date.now() + 3600000;
            return User.update(user);
        })
        .then(user => {
            transporter.sendMail({
                to: email,
                from: process.env.EMAIL,
                subject: 'Password Reset',
                html: `
                <p>You Requested a password reset</p>
                <p>Click this 
                    <a href="${process.env.BASE_URL}/reset/${token}">link</a> 
                    to set a new password
                </p>
                `
            });
            return res.render('reset-password', {
                csrfToken: '', 
                err: 'Email sent',
                email: '',
            });
        })
    });
}

exports.PasswordChanged = (req, res, next) => {
    const token = req.params.token;
    User.findByToken(token)
    .then(user => {
        if(!user){
            res.redirect('/');
        }
        res.render('reset-password2', {
            csrfToken: req.csrfToken(),
            email: user.email,
            err: '',
            token: token,
        });
    })
}

exports.PasswordChangedAction = (req, res, next) => {
    const errors = validationResult(req).array();
    const token = req.body.token;
    const email = req.body.email;
    if(errors.length > 0){
        return res.render('reset-password2', {
            csrfToken: req.csrfToken(),
            email: user.email,
            err: errors[0].msg,
            token: token,
        });
    }
    const pass = req.body.password;
    let changeuser;
    User.findByTokenEmail(token, email)
    .then(user => {
        if(!user){
            return res.render('reset-password2', {
                csrfToken: req.csrfToken(),
                email: user.email,
                err: 'Email or token not found',
                token: token,
            });
        }
        user.token = undefined;
        user.tokenExpiry = undefined;
        changeuser = user;
        return bcrypt.hash(pass, 12);
    })
    .then(hashedpass => {
        changeuser.password = hashedpass;
        User.update(changeuser);
        res.render('password-change', {csrfToken: req.csrfToken()});
    })
}

exports.SignInAction = (req, res, next) => {
    console.log('signin action');
    const errors = validationResult(req).array();
    const email = req.body.email;
    let stripe_id
    if(errors.length > 0){
        return SignInRender(res, req.csrfToken(), errors[0].msg, email);
    }
    const password = req.body.pass;
    User.findById(email)
    .then(user => {
        if(!user){
            return SignInRender(res, req.csrfToken(), 'Email not registered', email);
        }
        else {
            stripe_id = user.stripe_id;
            return bcrypt.compare(password, user.password)
        }
    })
    .then(doMatch => {
        if(!doMatch){
            return SignInRender(res, req.csrfToken(), 'Incorrect Password', email);
        }
        req.session.email = email;
        req.session.stripe_id = stripe_id;
        res.redirect('/');
    })
}

exports.SignUpAction = (req, res, next) => {
    const errors = validationResult(req).array();
    const name = req.body.name;
    const email = req.body.email;
    if(errors.length > 0){
        return SignUpRender(res, req.csrfToken(), errors[0].msg, name, email);
    }
    const pass = req.body.pass;
    bcrypt.hash(pass, 12)
    .then(hashedpass => {
        crypto.randomBytes(32, (err, buffer) => {
            if(err){
                console.log(err);
                return res.redirect('/passwordchange');
            }
            const token = buffer.toString('hex');
            const user = new User(name, email, hashedpass);
            user.token = token;
            user.tokenExpiry = Date.now() + 3600000;
            user.signup('tempusers');
            transporter.sendMail({
                to: email,
                from: process.env.EMAIL,
                subject: 'Verifiy Email',
                html: `
                <p>You created an Account</p>
                <p>Click this 
                    <a href="${process.env.BASE_URL}/verify/${token}">link</a> 
                    to verify your email.
                </p>
                `
            });
            res.render('email');
        })
    })
    .catch(err => throwerror(err, 500))
}

exports.Verify = (req, res, next) => {
    const token = req.params.token;
    let newuser;
    User.findByTokenTemp(token)
    .then(user => {
        if(!user){
            return res.redirect('/');
        }
        newuser = new User(user.fullname, user.email, user.password);
        User.deleteuser(user._id);
        return newuser.signup('users')
    })
    .then(user => {
        stripe.customers.create({
            name: newuser.email,
        })
        .then(customer => {
            User.addStripeId(user.insertedId, customer.id);
            return res.redirect('/signin');
        })
    })
    .catch(err => console.log(err))
}
