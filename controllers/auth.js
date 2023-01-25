const crypto = require('crypto')
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const sendEmail = require('../utils/sendEmail')


//@desc  Register User
//@route POST api/v1/auth/register
//@access Public
exports.register =  asyncHandler(async (req,res,next) => {
    const { name, email , password, role } = req.body
    
    //* Create User
    const user = await User.create({
        name,
        email,
        password,
        role,
    });

    //* Create Token 
    const token = user.getSignedJwtToken(); //* Modelde yaptığım jwt sign'ı mongoose'un methods fonksiyonuyla yaptım. ve getSignedJwtToken() yazarak tokeni çekmiş oldum. 
    // console.log(token);  tokeni çekmiş oldum

    res.status(200).json({ success : true,  token});
})


//@desc  Login User
//@route POST api/v1/auth/login
//@access Public
exports.login =  asyncHandler(async (req,res,next) => {
    const {  email , password} = req.body
    
    //* Validate email and password
    if(!email || !password) {
        return next(new ErrorResponse('Please provide email and password' , 400));
    }

    //* Check for user
    const user = await User.findOne({ email}).select('+password');

    if(!user) {
        return next(new ErrorResponse('Invalid Credentials !' , 401))
    }

    //* check if passwords matched
    const isMatch = await User.matchPassword(password); //* modelde oluşturduğumuz fonksiyonu burada kullandık. modeldeki this.password', burada User.passworda dönüşüyor misalliiiiiiiiiiiiiiiii. 

    if (!isMatch) {
        return next(new ErrorResponse('Invalid Credentials !' , 401))
    }
    
    //* aşşada yaptığım fonksyon
    sendTokenResponse(user, 200, res)

});



//@desc   Get current logged in user
//@route POST api/v1/auth/me
//@access Private
//* logged in user via token , profil sayfası için olması lazım sanırsam
exports.getMe =  asyncHandler(async (req,res,next) => {

    const user = await User.findById(req.user.id) 

    res.status(200).json({
        success: true,
        data: user, 

    })
})

//@desc   Update user details
//@route PUT api/v1/auth/updatedetails
//@access Private

exports.updateDetails =  asyncHandler(async (req,res,next) => {

    const fieldsToUpdate = {
        name : req.body.name,
        email : req.body.email,

    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new : true,
        runValidators :true,
    }) 

    res.status(200).json({
        success: true,
        data: user, 

    })
})


//@desc   Forgot password
//@route POST api/v1/auth/forgotpassword
//@access Public
//* logged in user via token , profil sayfası için olması lazım sanırsam
exports.forgotPassword =  asyncHandler(async (req,res,next) => {

    const user = await User.findOne({ email : req.body.email});

    if (!user) {
        return next(new ErrorResponse('There is no user with that email', 404))
    }

    //* get reset token - dışardan(usermodelde aşağı kısımda klasiko) fonksiyon hazırlayıp burada kullanıcaz. o fonksiyondu resetToken return ediyoduk, buradaki resetTokena almış oluyoruz. 
    const resetToken = user.getResetPasswordToken(); //* bu fonksiyonla, veritabanına hashlenmiş, 


    //* Create Reset Url - mail için url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/resetpassword/${resetToken} `

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`

    try {
        sendEmail({
            email : user.email, 
            subject: 'Password Reset Token',
            message
        });

        res.json(200).json({ success : true, data : 'Email Sent '})
    } catch (error) {
        console.log(error);

        user.resetPasswordToken = undefined ;
        user.resetPasswordExpire = undefined ;

        await user.save({ validateBeforeSave : false})

        return next (new ErrorResponse('Email could not be sent'), 500)


    }
    
    res.status(200).json({
        success: true,
        data: user, 

    })
})


//@desc   Reset Password
//@route PUT api/v1/auth/resetpassword/:resettoken
//@access Public


exports.resetPassword =  asyncHandler(async (req,res,next) => {

    //* get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex') //! Usermodel de en aşağıdaki fonksiyonlarda da acıklaması olduğu için açıklama yapmadım.

    const user = await User.findOne({
        resetPasswordToken, 
        resetPasswordExpire : { $gt : Date.now()}
    });

    if(!user) {
        return next( new ErrorResponse('Invalid Token', 400))
    }
    
    //* set new password
    user.password = req.body.password ;
    user.resetPasswordToken = undefined ;
    user.resetPasswordExpire = undefined ;

    await user.save()


    
})



//!helper bu ana yapmak istediğimiz şey değil dedi reis
//* Get token from model, create cookie and send response
const sendTokenResponse = (user,statusCode, res) => {
    //*Create Token
    const token = user.getSignedJwtToken(); //* Modelde yaptığım jwt sign'ı mongoose'un methods fonksiyonuyla yaptım. ve getSignedJwtToken() yazarak tokeni çekmiş oldum. 

    const options = {
        expires : new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000), //30 day
        httpOnly : true,
        secure : true,
    }

    res
    .status(statusCode)
    .cookie('token', token, options) //* 0- .cookie' diye kullanabilme sebebimiz server.js 'de cookieparser yaptığımız için. 1- 'token' bizim verdiğimiz cookie isimi. 2- token bizim user'dan aldığımız token ve onu cookie' ye gönderiyoruz. 3- son olarak optionsları belirlemek için gönderdiğimiz şeyler.
    .json({
        success : true,
        token,

    })
} 


