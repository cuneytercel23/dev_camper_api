const jwt = require("jsonwebtoken");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

//* Protect Routes - bunun ismini daha doğrusu checkUser yapmalıydık bence ama neysem ama giriş yapan kullanıcı mevzuatı var işin içinde işte

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1]; //* bunu biliyon zaten cücü anlattırma gene kendine
  } else if (req.cookies.token) {
    //* req.cookies ile cookie' ye erişebiliyorum. Sondaki .token benim authcontroller'da verdiğim string, zurna deseydim burda zurna yazacaktık.
    token = req.cookies.token;
  }

  //* make sure exist

  if (!token) {
    return next(new ErrorResponse("Not authorize to access this route"), 401);
  }

  try {
    //* Verify Token
    //! Verifylanmış tokenı olan kullanıcıyı , req.user 'a eşitliyoruz. Önemli bilgi !
    const decoded = jwt.verify(token, process.env.JWT_SECRET); //* Secreti kullanarak çöz babacım.

    req.user = await User.findById(decoded.id); //* req.user'a kodu decodelanmış ve db'den alınmış kullanıcıyı eşitledik.

    next(); //* sonra nextooo
  } catch (error) {
    return next(new ErrorResponse("Not authorize to access this route"), 401);
  }
};

//* grant access to spesific roles - erişimine izini ver

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User Role ${req.user.role} is unauthorized to access this route`
        ),
        403
      );
    }
    next();
  };
};
