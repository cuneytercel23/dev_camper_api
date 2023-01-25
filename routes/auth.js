const { register, login, getMe, forgotPassword, resetPassword, updateDetails} = require('../controllers/auth');

//* protect (userverify)
const { protect } = require('../middlewares/auth');

const router = require('express').Router();





router.post('/register', register)
router.post('/login', login)
router.get('/me',protect, getMe)
router.get('/forgotpassword', forgotPassword)
router.put('/resetpassword', resetPassword)
router.put('/updatedetails', protect ,updateDetails)

module.exports = router ;