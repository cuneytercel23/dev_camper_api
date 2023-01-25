const mongoose = require('mongoose');
const { default: slugify } = require('slugify');
const Slugify = require('slugify');
const geocoder = require('../utils/geocode');

const BootcampSchema = new mongoose.Schema({
    name : {
        type : String,
        required : [true ,'Please add a name '],
        unique : true,
        trim : true,
        maxlength : [50, 'Name can not be more than 50 characters']
    },
    slug : String,

    description : {
        type : String,
        required : [true ,'Please add a description '],
        maxlength : [500, 'Description can not be more than 500 characters']

    },

    website : {
        type : String,
        match : [/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
                    'Please use a valid URL with HTTP or HTTPS']
    },
    phone : {
        type : String,
        maxlength : [20, 'Phone Number can not be more than 20 characters']
    },

    email : {
        type : String,
        match : [ /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 
                'Please add a valid e-mail']
    },

    address : {
        type: String,
        required: [true, 'Please add an adress']
    },

    location : {
        //*GeoJson Point, mongoose dökümantasyonunda içerisindeki parametreleri kopyalayıp yapıştırıyorum
            type : {
                type : String,
                enum : ['Point'], //* point var enumda yani sadece point olmalı ama point ne bilmiyorum :D
            },
            coordinates : {
                type : [Number],
                index : '2dsphere' //* bu longitude ile latitude bilgileri olması lazım
            },
            formattedAdress : String,
            street : String,
            city : String,
            state : String,
            zipcode : String,
            country : String,
    },
    careers : {
        //?array of strings
        type : [String],
        required : true,
        enum : [ //* enum olduğu zaman, sadece bu değerler kullanılabilir.
            'Web Development',
            'Mobile Development',
            'UI/UX',
            'Data Science',
            'Business',
            'Other',            
        ]
    },
    averageRating : {
        type : Number,
        min : [1, 'Rating must be at least 1'],
        max : [10, 'Rating can not be more than 10']
    },
    averageCost : Number,

    photo : {
        type : String,
        default : 'no-photo.jpg'  
    },
    housing : { //* ne olduğunu bilmiyorum ama sanırsam bootcamp'in ev sağlayıp sağlamadığından bahsediyoruz hani online değilse hesabı
        type : Boolean,
        default : false,
    },
    jobAssistance : {
        type : Boolean,
        default : false,
    },
    jobGuarantee : { //iş garantisi
        type : Boolean,
        default : false,
    },
    acceptGi : { // bu ne bilmiyorum
        type : Boolean,
        default : false,
    },
    createdAt : {
        type : Date,
        default : Date.now,
    },  
    user : { //* ref
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true, 
    }
}, 
{
toJSON : { virtuals : true}, //* virtuals mevzusu için bu ikiliyi yazdık, yazmassak olmuyor sanırsam.
toObject : { virtuals : true},
}
);

BootcampSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower : true})
    console.log('Slugify Run', this.name );
    next();
})

//* Geocode, create location field, geocode adresi alarak konumu kordinatları çözüyor.

BootcampSchema.pre('save', async function (next) {
    const loc = await geocoder.geocode(this.address);
    this.location = { //* yukardaki modelin içini dolduruyoruz.
        type : 'Point', //* modelde de enum kısmında sadece point vardı.
        coordinates : [loc[0].longitude, loc[0].latitude],
        formattedAdress : loc[0].formattedAddress,
        street : loc[0].streetName,
        city : loc[0].city,
        state : loc[0].state,
        zipcode : loc[0].zipcode,
        country : loc[0].country    
    };

    //* adresi kaydetme, çünkü onun yerine location kaydediyoruz.
    this.address = undefined;
    next();
});



//* Cascade Delete - artarda silme , mesela bir bootcamp'i silince tüm courselar da silinmelidir.
BootcampSchema.pre('remove', async function (next) {
    await this.model('Course').deleteMany({ bootcamp : this._id }) // course'un bootcamp parametresi, buradaki(bootcamp) id'si eşit olanı sil.
    next();
})


//* Reverse populate with 'virtuals', Bunun sebebi normalde modelin içinde veririrz ya ref falan fişman diye. burda vermiyoruz diye kendimize sahte alan oluşturuyoruz. ve bu fonksiyonla bootcamps controller'da course'a erişebilecem benim modelimde hiç olmamasına rağmen.
//* reverse populate ismi de ordan geliyor, bootcamp controller'da populate('courses') diyerek, bu datalara erişebiliyorum.
BootcampSchema.virtual('courses',{
    ref : 'Course', 
    localField : '_id',  //*localField parametresi, Bootcamp modelinin alanıyla eşleştirileceğini belirtir. Bu örnekte, _id alanı ile eşleştirilecektir.
    foreignField : 'bootcamp',//*foreignField parametresi ise, Course veri modelinin hangi alanının Bootcamp modelinin _id alanıyla eşleştirileceğini belirtir. Bu örnekte, bootcamp alanı ile eşleştirilecektir.
    //* yani bootcamp'in _id'si ile , course'ın bootcampini eşleştirdik.
    justOne : false
})








module.exports = mongoose.model('Bootcamp', BootcampSchema);
