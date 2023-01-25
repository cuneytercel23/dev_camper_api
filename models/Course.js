const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title : { 
        type :  String,
        trim : true,
        required: [true, 'Please add a course title']
    },
    description : {
        type : String,
        required : [true, 'Please add a course description']
    },

    weeks : {
        type : String,
        required : [true, 'Please add a number of weeks']
    },
    tuition : { //* harç, kurs ücreti
        type : String,
        required : [true, 'Please add a tuition cost']
    },
    minimumSkill : {
        type : String,
        required : [true, 'Please add a minimum skill'],
        enum : ['beginner', 'intermediate' , 'advanced']
    },

    scholarshipAvailable : {
        type : Boolean,
        default : false,
    },
    createdAt : {
        type : Date,
        default : Date.now,
    },

    bootcamp : { //* ref
        type : mongoose.Schema.ObjectId,
        ref : 'Bootcamp',
        required : true, 
    },
    user : { //* ref , bunu sonradan  ekledik projenin başında yoktu.
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true, 
    },
});

//! ortalama harç hesaplama cok acıklama yapmıcam burda yazdığımız fonksiyonu, ve sonrada db'ye yazmaca aşağıdakilerde calıstırıcaz.
//* static method to get average of course tuitions - ortalama harç hesaplama
CourseSchema.static.getAverageCost = async function(bootcampId) {
    console.log('Calculating average cost ...');

    const obj = await this.aggregate([{
        $match : { bootcamp : bootcampId}
    },
    {
        $group : { _id : '$bootcamp', averageCost : { $avg : '$tuition'}}
    }
]);

    try {
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageCost : Math.ceil(obj[0].averageCost/10) * 10 
        });
    } catch (error) {
        console.error(error);
    }




console.log(obj); // _id : 231231231223 , averageCost : 10000 datası geliyor.

}

//*Call getAverage cost after save 
CourseSchema.post('save', function() {
    this.constructor.getAverageCost(this.bootcamp); //* yukarda yaptığım fonksiyonu calıstırdım ve bize ortalama verioyr.


});

//*Call getAverage cost before remove 
CourseSchema.pre('save', function() {
    this.constructor.getAverageCost(this.bootcamp);
    
})

module.exports = mongoose.model('Course', CourseSchema);




//! Average cost hesaplama ve db'ye kaydetme yeri açıklama

// Bu kod, Mongoose kütüphanesi kullanarak "Course" isimli bir MongoDB koleksiyonunda bulunan belirli bir bootcamp'a ait tüm derslerin ortalama ücretini hesaplamak ve sonra bootcamp'ın averageCost alanını güncellemek için kullanılabilecek bir statik yöntemi tanımlar.

// Yöntem tek bir argüman alır:

// bootcampId: Ortalama maliyeti hesaplanacak derslerin ait olduğu bootcamp'ın kimliği.
// Kod şu şekilde çalışır:

// Öncelikle, "Calculating average cost ..." mesajını console.log() kullanarak konsola gönderir.
// Daha sonra, Bootcamp Id'sine göre filtreleme yaparak modellerdeki tüm derslerin tuition alanını almak için aggregate() metodunu kullanır. Bu pipeline 2 adım içerir :
// $match: Bu adım koleksiyondaki belgeleri sadece bootcamp alanı bootcampId argümanı ile eşleşen belgelerle sınırlar.
// $group: Bu adım filtrelenmiş belgeleri bootcamp alanına göre gruplar ve ortalama tuition alanını hesaplamak için $avg operatörünü kullanarak yeni bir belge oluşur. Bu adım bootcamp'a göre grupluyor ama sadece bir tane bootcamp için filtrelemekte olduğu için id alanını $bootcamp olarak kullanmak daha uygun olacaktır.
// Bu pipeline'ın sonucunu obj değişkenine atar.
// Daha sonra, bu ortalama maliyeti, 10'a bölünüp yukarı yuvarlanarak ve sonra 10 ile çarpılarak elde edilen ortalama maliyeti ile bootcamp belgesinin averageCost alanını günceller.
// Bir hata oluşursa, hata console.error() methoduna iletilir ve konsola hata mesajı gönderilir.
// this.model('Bootcamp') kullanılarak Bootcamp modeline erişilir ama daha sık kullanılan bir yolu mongoose.model('Bootcamp') şeklindedir.