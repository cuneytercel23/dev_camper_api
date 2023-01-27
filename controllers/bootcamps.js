//* veritabanı test verilerinpm

const path = require("path"); //* core modülü
const asyncHandler = require("../middlewares/async");
const Bootcamp = require("../models/Bootcamp");
const ErrorResponse = require("../utils/errorResponse");
const geocoder = require("../utils/geocode");

//@desc Get all bootcamps
//@route GET api/v1/bootcamps
//@access Public

exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

//@desc Get a single bootcamp
//@route GET api/v1/bootcamps/:id
//@access Public

exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ success: true, data: bootcamp });
});

//@desc Create a bootcamp
//@route POST api/v1/bootcamps
//@access Private

exports.createBootcamp = asyncHandler(async (req, res, next) => {
  //* Add user to req.body for adding bootcamp
  req.body.user = req.user.id; //* Normalde login olan arkadaş, req.user'daydı(auth middlewareden ötürü.), bizde şimdi aşağıda bootcamp oluşturuyoruz ya , req.body'nin içine ekliyoruz ki modele o da yazılsın. Yani buda demekki(sonradan görürsem diye diyorum), user en başta modelde yoktu sonradan ekledik.

  //* Check for published bootcamp , bir kullanıcı sadece 1 bootcamp yayınlayabilir admin değilse.
  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

  //* if the user is not an admin, they can only add one bootcamp
  if (publishedBootcamp && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user.id} has already published a bootcamp`,
        400
      )
    );
  }

  const bootcamp = await Bootcamp.create(req.body);

  res.status(200).json({ success: true, data: bootcamp });
});

//@desc Update a bootcamp
//@route PUT api/v1/bootcamps/:id
//@access Private

exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  //* Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    //* bootcamp'in kurucusu , şuan online olan kurucu değilse yada rolü admin değilse..
    return next(
      `User  ${req.params.id} is not authorized to update this bootcamp`,
      401
    );
  }

  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: bootcamp });
});

//@desc Delete a bootcamp
//@route DELETE api/v1/bootcamps/:id
//@access Private

exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  // const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id); NORMALDE BÖYLEYDİ, MODELDE CASCADE DELETE YAPTIĞIMIZ İÇİN DEĞİŞTİRİYORUZ.
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  //* Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    //* bootcamp'in kurucusu , şuan online olan kurucu değilse yada rolü admin değilse..
    return next(
      `User  ${req.params.id} is not authorized to delete this bootcamp`,
      401
    );
  }

  bootcamp.remove(); //! Cascade Delete yaptığımız için (modelde), remove fonksiyonunu kullandık çünkü o middleware' i çağırdık. o middleware'de ayrıca bootcamp'E ait olan kursları siliyor.

  res.status(200).json({ success: true, data: {} });
});

//@desc Get bootcamps within a radius
//@route GET api/v1/bootcamps/radius/:zipcode
//@access Private
//* Belirlediğim alan içerisinde, çember içerisinde bulunan bootcampleri arama.
//* örneğin http://localhost:5000/api/v1/bootcamps//radius/02118/10  - zipcode'u bostonun zipcode'u , 10'da , 10 miles km uzaklıklardaki bootcampleri ara diye. ve db'De sadece bostonda olan vardı onu buldu.

exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  //* get latitude/longitude from geocoder
  const loc = await geocoder.geocode(zipcode); //* zipcode'u kullanarak oranın longitude ve latitude'unu yani kordinatlarını buluyoruz.
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  //* Calc radius using radians
  //* divide distance by radius of earth
  //* Earth radius = 3.963 miles | 6378 km

  const radius = distance / 3963;

  // $geoWithin işlecini kullanarak, verilen zipcode'un belirli bir yarıçapı içinde bootcamp'ları arama
  // $centerSphere işleci, verilen longitude ve latitude değerlerine göre ve verilen radyana göre yeryüzünde bir çember oluşturur
  // Bu çember içindeki "location" alanına sahip tüm bootcamp'ları bul
  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});

//@desc Upload photo for bootcamp
//@route PUT api/v1/bootcamps/:id/photo //* put ?? güncelleme gelebileceği için olmalı
//@access Private

exports.bootcampUploadPhoto = asyncHandler(async (req, res, next) => {
  // const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id); NORMALDE BÖYLEYDİ, MODELDE CASCADE DELETE YAPTIĞIMIZ İÇİN DEĞİŞTİRİYORUZ.
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  //* Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    //* bootcamp'in kurucusu , şuan online olan kurucu değilse yada rolü admin değilse..
    return next(
      `User  ${req.params.id} is not authorized to update this bootcamp`,
      401
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload an existing file`, 400));
  }

  //!
  const file = req.files.canımNeIsterse; //! postman'de form-data kısmında sol tarafa file yazıyorduk ya genelde, oranın sebebiii buymuşşşş NONOONONONONON, şimdi canımNeIsterse yaptım. onun dışındaki şeyleri kabul etmiyor.
  //!

  //* Make sure the image is photo
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  //* Check Image File Size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }
  //* Create Custom File Name
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`; //* o anki bootcampin id'sini ekledik.
  console.log(file.name); // photo_1232312.jpg

  //*Upload file

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    //* ilk girdiğimiz path
    if (err) {
      console.error(err);
      return next(
        new ErrorResponse(`A Problem occured about file upload`, 500)
      );
    }
    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name }); //* normalde modelde no-photo.jpg, şimdi güncelliyoruz göya :D, burada req.params.id'si eşit olanı al ve photo kısmını onunla değiştir.

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});
