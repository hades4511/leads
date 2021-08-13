const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');

const router = express.Router();

const IsAuth = (req, res, next) =>{
    if(!req.session.email || !req.session.isadmin){
        return res.redirect('/admin/signin');
    }
    next();
}


router.get('/signin', adminController.SignIn);
router.post(
    '/signin',
    [
      body('email', 'Please enter a valid Email')
        .notEmpty()
        .trim()
        .isEmail(),
    ],
    adminController.SignInAction
);

router.post('/lead', IsAuth, adminController.LeadAction);
router.get('/lead', IsAuth, adminController.Lead);
router.get('', IsAuth, adminController.Dashboard);

module.exports = router;
