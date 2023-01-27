const path = require('path')
const express = require('express');
const dotenv = require('dotenv')
//const logger = require('./middlewares/logger')
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/error');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');

//apisecurity-muhtemelen burası pek aklında kalmayacak ama sadece indirip app.use()'a koyuyoruz adamlar halletmiş :D
const mongoSanitize = require('express-mongo-sanitize'); //$gt ile token çözenleri engelledi
const helmet = require('helmet');
const xss = require('xss-clean'); // html verileri yada script ile, falan yazılınca onları engellemek amaç yani password kutucuğu hacker'a gidebilir, amaç onu engellemek.
const rateLimit = require('express-rate-limit');
const hpp = require('hpp'); 
const cors = require('cors');



//*load env vars
dotenv.config({path : './config/config.env'})

//* Connect to DataBase
connectDB();

//* Route files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const user = require('./routes/user');
const review = require('./routes/review');


const app = express();

//*body parser
app.use(express.json());

//* cookie parser
app.use(cookieParser()); //* kuki kullanmak için gerekli

//* dev logging middleware 
app.use(morgan('dev')); //* middleware'de loggerjs oluşturdum. Onun yaptığı işlevi bu yapıyor ama loggerjs'i silmicem kalsın.

//* File uploading with express-fileupload
app.use(fileupload())

// Apı Security 

//data sanitize - data dezenfekte etme, sadece import edip middleware olarak çalıştırıyoruz.
app.use(mongoSanitize());

//set security headers
app.use(helmet());

//prevent xss attacks
app.use(xss());

// rate limiting
const limiter = rateLimit({
    windowMs : 10 * 60 * 1000, // 10 mins
    max : 100
})

app.use(limiter);

//prevent http param polution
app.use(hpp());

//enable cors
app.use(cors()); 
// buraya kadar api security idi


//* Set static folder 
app.use(express.static(path.join(__dirname, 'public')));

//*Mount routers
app.use('/api/v1/bootcamps' , bootcamps);
app.use('/api/v1/courses' , courses);
app.use('/api/v1/auth' , auth);
app.use('/api/v1/review' , review);
app.use('/api/v1/user' , user);


app.use(errorHandler); //* bunun routerlardan önce olması lazım




const port = process.env.PORT || 5000;


const server = app.listen(port, ()=> {
    console.log("Server running in");

})

//* Handle unhandled promise rejections - MongoDB veya bazı handle'lanamayan up uzun hatalar yerine bunu yapıyoruz.
process.on('unhandledRejection', (err,promise) => {
console.log(`Error ${err.message}`);
// Close server and exit process
server.close(() => { process.exit(1)});
})