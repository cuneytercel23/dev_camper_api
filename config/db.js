const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

const connectDB = async() => {
   const conn  = await mongoose.connect(process.env.MONGO_URI, {
    //useNewUrlParser : true,
    //useCreateIndex : true, //* bunlar eski kalmış calısmıyor :D
    //useFindAndModify : false,
   }) 
    console.log(`MongoDB Connected : ${conn.connection.host}`);
};

module.exports = connectDB;