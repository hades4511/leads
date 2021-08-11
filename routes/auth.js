const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();


router.get('/signin', authController.SignIn);
router.get('/signup', authController.SignUp);
router.post(
    '/signin',
    [
      body('email', 'Please enter a valid Email')
        .notEmpty()
        .trim()
        .isEmail(),
    body('pass', 'Please enter a password with atleast 8 characters containing at least one uppercase letter, one lowercase letter, and one number')
        .notEmpty()
        .trim()
        .isStrongPassword(
          {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 0
          }
        ),
    ],
    authController.SignInAction
  );
router.post(
    '/signup',
    [
        body('name', 'Please enter a name containing only alphabets')
            .notEmpty()
            .trim()
            .custom((value) => {
            return value.match(/^[A-Za-z ]+$/);
            }),
        body('email', 'Please enter a valid email')
            .notEmpty()
            .trim()
            .isEmail()
            .custom((value) => {
                return User.findById(value)
                .then(result => {
                    if(result){
                        return Promise.reject('Email already exists');
                    }
                });
            }),
        body('pass', 'Please enter a password with atleast 8 characters containing at least one uppercase letter, one lowercase letter, and one number')
            .notEmpty()
            .trim()
            .isStrongPassword(
              {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 0
              }
            ),
        body('pass2')
            .custom( (value, {req} ) => {
              if(value.trim() !== req.body.pass){
                throw new Error('Passwords do not match');
              }
              return true;
            })
    ],
    authController.SignUpAction
)

router.post(
  '/reset', 
  [
    body('password', 'Please enter a password with atleast 8 characters containing at least one uppercase letter, one lowercase letter, and one number')
        .notEmpty()
        .trim()
        .isStrongPassword(
          {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 0
          }
        ),
    body('confirmpass')
        .custom( (value, {req} ) => {
          if(value.trim() !== req.body.password){
            throw new Error('Passwords do not match');
          }
          return true;
        })
  ],
  authController.PasswordChangedAction)
router.get('/reset/:token', authController.PasswordChanged);
router.post('/passwordchange', authController.PasswordChangeAction);
router.get('/passwordchange', authController.PasswordChange);

module.exports = router;
