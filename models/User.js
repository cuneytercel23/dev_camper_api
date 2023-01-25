const mongoose = require('mongoose');
const bcrpytjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')


const UserSchema = new mongoose.Schema({
    name : {
        type : String,
        required : [true, 'Please add a name'],
    },
    email : {
        type : String,
        required : [true, 'Please add an email'],
        unique : true,
        match : [ /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 
                'Please add a valid e-mail']
    },
    role : {
        type : String,
        enum : ['user', 'publisher'],
        default : 'user',

    },
    password : {
        type : String,
        required: [true, 'Please add a password'],
        minlength : 6,
        select : false, //* sanırsam select ile buna erişemiyoruz. bunu yani response olarak kullanmıcaz.
    },
    resetPasswordToken : String,
    resetPasswordExpire : Date,
    createdAt :  {
        type : Date,
        default : Date.now,
    }
})


//* Encrypt Password Using bcrpytjs 

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next(); //* şifre hiç değişmemişsse next
    }


    const salt = await bcrpytjs.genSalt(10);
    this.password = await bcrpytjs.hash(this.password, salt);
     
})


//* Sign JWT and Return
//* içeriye sadece id sakladık
//*AuthController'da (user), user.getSignedJwtToken() yaparak, tokeni oraya döndürmüş olucam.
UserSchema.methods.getSignedJwtToken = function () { //* methods = Mongoose'da, yöntemler, bir modelin bir örneğinde kullanabileceğiniz fonksiyonlardır. Veri modelinin verileriyle ilgili çeşitli işlemler gerçekleştirmek için kullanılabilirler. Mongoose şemasındaki .methods özelliği, kendi özel yöntemlerinizi ekleyebileceğiniz bir nesnedir, böylece şema ile ilişkili olan modelin örneklerinde kullanılabilirler. Burada, getSignedJwtToken fonksiyonu .methods nesnesine eklenmiştir. Bu fonksiyon User modelinin bir örneğinde çağrılabilir. Yani user.getSignedJwtToken() fonksiyonunu çağırdığınızda JWT token geri dönecektir. Bu .methods ile yapılan şey, yaptığınız fonksiyonları sadece belirli bir modele özgü hale getirmektir. Bu sayede global scope dışında kalır ve modele özgü olarak çalışır. Özetle, .methods Mongoose Şemalarının bir özelliğidir, bu özellik ile modele özgü fonksiyonlar oluşturulur ve modele özgü işlemler gerçekleştirilebilir. Bu örnekte özellikle JWT Token oluşturmak için kullanılmıştır
    return jwt.sign({ id : this._id}, process.env.JWT_SECRET , { //* mesela burda this diye yazdık ya daha sonra User modelini bi yerde kullanırsak oradaki this o user oluyor.
        expiresIn : process.env.JWT_EXPIRE, 
    }) 
}

//* Match user entered password to hashed password in db
UserSchema.methods.matchPasswords = async function(enteredPassword) {
    return await bcrpytjs.compare(enteredPassword, this.password) //* girilen ile db'deki aynımı diye karşılaştır.
}

//* generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {

    //* generate token 
    const resetToken = crypto.randomBytes(20).toString('hex'); //* random bişiler oluşturuyor(örn c213fk2), buffer tipinde olduğu için daha sonra tostring ile hex yapıyor. hex => (örneğin c2ad132323fk2), hex yerine utf-8 yapsaydık, gene aynı şey olurdu ama utf-8 karakterleri falan hexadan daha az güvenliymiş

    //* hash token and set to resetPasswordToken field(in user model)
    this.resetPasswordToken = crypto //? aşağıdaki özellikler, crypto'nun özellikleri
    .createHash('sha256') //* sha-256 algosunu kullanarak hash nesnesi oluşturdu.  ******** crypto.createHash('sha256') : Bu satır, SHA-256 adlı bir hash algoritması kullanarak bir hash nesnesi oluşturur. Örnek olarak, '4e4b4e4c4f4e4b4e4c4f4e4b4e4c4f4e4b4e4c4f4e4b4e4c4f4e4b4e4c4f4e4b' gibi bir hash nesnesi oluşabilir.
    .update(resetToken) //* yukardaki random hash oluşturdu, burada da hashlemek istediğimiz veriyi (resetToken) girdik.
    .digest('hex') //* buda hexadecimala ceviriyor.
    //! Özetlersem, resetToken döndürüyoruz kendimize(abc), ama db'deki resetPasswordToken'ı hashli gönderiyoruz. kapiş :X 


    //* set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000 ; // 10 dakkaya expire oluyor.
    

    return resetToken;

}





module.exports = mongoose.model('User', UserSchema);
    