const express = require('express');
const router = express.Router();
const {v4: uuidv4}=require('uuid');
//const io = require('socket.io')(server);
const User = require('../model/User');
const Doctor=require('../model/Doctor');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));
// Home
router.get('/home', ensureAuthenticated, (req, res) =>
  res.render('home', {
    user: req.user,
  })
);
// HomeDoc
router.get('/homeDoc', ensureAuthenticated, (req, res) =>
  res.render('homeDoc', {
    user: req.user,
  })
);
module.exports = router;
