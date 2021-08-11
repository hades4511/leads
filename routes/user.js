const express = require('express');
const { body } = require('express-validator');

const isAuth = require('../authentication/isAuth');
const userController = require('../controllers/user');

const router = express.Router();

router.get('/setting', isAuth, userController.Settings);
router.post('/setting', isAuth, userController.SettingsAction);
router.get('/billing', isAuth, userController.Billing);
router.get('/save', isAuth, userController.SaveCard);
router.get('/makedefault', isAuth, userController.MakeDefault);
router.get('/subscribe', isAuth, userController.Subscribe);
router.get('', isAuth, userController.Dashboard);

module.exports = router;
