const asyncHandler = require("../middlewares/async");
const Bootcamp = require("../models/Bootcamp");
const Course = require("../models/Course");
const ErrorResponse = require("../utils/errorResponse");

//@desc Get all courses
//@route GET api/v1/courses
//@route GET api/v1/bootcamps/:bootcampId/courses //* seçilen bootcampe ait, kursları getirme
//@access Public
exports.getCourses = asyncHandler( async (req,res,next) => {
    //*advanced results öncesi böyle
    // let query ;

    // if (req.params.bootcampId) { //* eğer url'de req.params'da bootcampId' varsa.. * Seçilen bootcamp'e ait course'ları getirme.
    // query = Course.find({ bootcamp : req.params.bootcampId}) //* bootcampi, url'de yazdığımız bootcampId' ye eşit olanı bul ve çağır
    // } else { //* eğer yoksa direkt hepsini al. * Bütün Course'ları getirme
    //     query = Course.find().populate({
    //         path : 'bootcamp', //* bootcampi göster direkt, sadece id olarak değil komple ottomanen aç modeli
    //         select : 'name description', //* bootcampin içindekilerden sadece name ve description'ı göster.  
    //     }); 
    // }
    // const courses = await query;

    // res.status(200).json({
    //     success : true,
    //     count : courses.length,
    //     data : courses,
    // })

   //* buda kısaltılmış hali

    if (req.params.bootcampId) { //* eğer url'de req.params'da bootcampId' varsa.. * Seçilen bootcamp'e ait course'ları getirme.
    const courses = await Course.find({ bootcamp : req.params.bootcampId}) //* bootcampi, url'de yazdığımız bootcampId' ye eşit olanı bul ve çağır
        return res.status(200).json({
            success : true,
            count : courses.length,
            data : courses
        })

    } else { //* eğer yoksa direkt hepsini al. * Bütün Course'ları getirme
        res.status(200).json(res.advancedResults)
    }

})


//@desc Get single course
//@route GET api/v1/courses/:id
//@access Public
exports.getCourse = asyncHandler( async (req,res,next) => {
    
    const course = await Course.findById(req.params.id).populate({
        path: 'bootcamp',
        select: 'name description'
    })

    if(!course) {
        return next (new ErrorResponse(`No course with the id of ${req.params.id}`), 404)

    }

    res.status(200).json({
        success : true,
        data : course,
    })

})


//*Önemli
//@desc Add course
//@route POST api/v1/bootcamps/:bootcampId/courses //* bootcampin içine kurs ekleme
//@access Private
exports.addCourse = asyncHandler( async (req,res,next) => {

    req.body.bootcamp = req.params.bootcampId //*  url'deki bootcampId'yi(daha önce tıklayıp, JS bootcampine girdim mesela, url'deki JS bootcampinin id'sini alıp)(api/v1/bootcamps/:bootcampId/courses), req.body.bootcamp'e(course'modelindeki bootcamp'E) eşitledim çünkü o bootcamp'in içine kurs eklicem .
    req.body.user = req.user.id //* req.user.id(login olan kullanıcıyı), req.body.user(course modeli içindeki, user kısmına eşitledik.)

    const bootcamp = await Bootcamp.findById(req.params.bootcampId);
    
    if (!bootcamp) {
        return next (
            new ErrorResponse(`No bootcamp with id of ${req.params.bootcampId}`, 404)
        );
    }

      //* Make sure, user is bootcamp owner 
      if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') { //* bootcampin' kurucusu , şuan online olan kurucu değilse yada rolü admin değilse..
        return next(`User  ${req.user.id} is not authorized to add a course to this bootcamp ${bootcamp._id}`, 401)
       }

    const course = await Course.create(req.body)

    res.status(200).json({
        success : true,
        data : course,
    })

})



//@desc Update course
//@route PUT api/v1/courses/:id 
//@access Private
exports.updateCourse = asyncHandler( async (req,res,next) => {
    
    let course = await Course.findById(req.params.id);
    
    if (!course) {
        return next (
            new ErrorResponse(`No course with id of ${req.params.id}`, 404)
        );
    }

    //* Make sure, user is course owner 
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') { //* kurs'un oluşturucusu , şuan online olan kurucu değilse yada rolü admin değilse..
        return next(`User  ${req.user.id} is not authorized to update this course ${course._id}`, 401)
       }


    course =  await Course.findByIdAndUpdate(req.params.id, req.body, {
        new : true,
        runValidators : true,
    })

    res.status(200).json({
        success : true,
        data :  course,
    })

})


//@desc Delete course
//@route DELETE api/v1/courses/:id 
//@access Private
exports.deleteCourse = asyncHandler( async (req,res,next) => {
    
    let course = await Course.findById(req.params.id);
    
    if (!course) {
        return next (
            new ErrorResponse(`No course with id of ${req.params.id}`, 404)
        );
    }

    //* Make sure, user is course owner 
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') { //* kurs'un oluşturucusu , şuan online olan kurucu değilse yada rolü admin değilse..
        return next(`User  ${req.user.id} is not authorized to delete this course ${course._id}`, 401)
       }

    await course.remove();

    res.status(200).json({
        success : true,
        data :  {},
    })

})





