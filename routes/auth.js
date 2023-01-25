const { register, login, getMe, forgotPassword, resetPassword, updateDetails, updatePassword} = require('../controllers/auth');

//* protect (userverify)
const { protect } = require('../middlewares/auth');

const router = require('express').Router();





router.post('/register', register)
router.post('/login', login)
router.get('/me',protect, getMe)
router.get('/forgotpassword', forgotPassword)
router.put('/resetpassword', resetPassword)
router.put('/updatedetails', protect ,updateDetails)
router.put('/updatepassword', protect,updatePassword)

module.exports = router ;