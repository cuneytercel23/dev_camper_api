const { getCourses, getCourse, addCourse, updateCourse, deleteCourse} = require('../controllers/courses');

const router = require('express').Router({mergeParams : true}); //* mergeParams routerların iletişim kurmasını sağlar, yani bootcamp routerında, buraya route yapıyoruz ve burası artık '/:bootcampId/courses' ilede başlayabiliyor. hem app.js'in gönderdiği rout hem de /api/v1/courses çalışyıor.


//* advanced results gereklilikleri
const advancedResults = require('../middlewares/advancedResults');

const Course = require('../models/Course');

//* protect (user verify)
const { protect, authorize} = require('../middlewares/auth');


router
.route('/') //* '/:bootcampId/courses' veya '/api/v1/courses'   // mergeParams özelliğiyle birleşime izin verdiğimiz için soldaki route'uda kullanabiliyoruz..
.get(advancedResults(Course, {
    path : 'bootcamp', 
    select : 'name description',  
}),getCourses) 
.post(protect,authorize('publisher', 'admin'),addCourse); 

router.route('/:id') //* /:bootcampId/courses/:id
.get(getCourse)
.put(protect,authorize('publisher', 'admin'),updateCourse)
.delete(protect,authorize('publisher', 'admin'),deleteCourse)
 


module.exports = router ;