const { register, login, getMe, forgotPassword, resetPassword } = require('../controllers/auth');

//* protect (userverify)
const { protect } = require('../middlewares/auth');

const router = require('express').Router();





router.post('/register', register)
router.post('/login', login)
router.get('/me',protect, getMe)
router.get('/forgotpassword', forgotPassword)
router.put('/resetpassword', resetPassword)

module.exports = router ;