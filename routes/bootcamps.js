const { getBootcamps, getBootcamp, updateBootcamp ,createBootcamp,deleteBootcamp, getBootcampsInRadius, bootcampUploadPhoto } = require('../controllers/bootcamps');

//*include other resource routers
const courseRouter = require('./courses');
const reviewRouter = require('./review')

const router = require('express').Router();

//* advanced results gereklilikleri
const Bootcamp = require('../models/Bootcamp')
const advancedResults = require('../middlewares/advancedResults');

//* protect (verify user)
const { protect, authorize } = require('../middlewares/auth');



router.route('/')
.get(advancedResults(Bootcamp,'courses'),getBootcamps)
.post(protect,authorize('publisher', 'admin'),createBootcamp)

router.route('/:id')
.get(getBootcamp)
.put(protect,authorize('publisher', 'admin'),updateBootcamp)
.delete(protect,authorize('publisher', 'admin'),deleteBootcamp)


//*re-route into other resource routers * bootcamp routes'dan courseRoute'una erişmece
router.use('/:bootcampId/courses', courseRouter); //* /api/v1/bootcamps/1231321/courses gelirse -> courseRouter'a pasla ve orada hem bu route'ları çalıştırabilir hem de kendilerine özeller çalışabiliyor zaten.
router.use('/:bootcampId/reviews', reviewRouter); 



router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius)

router.route('/:id/photo').put(protect,authorize('publisher', 'admin'),bootcampUploadPhoto); //* /api/v1/bootcamps/213/photo





module.exports = router ;