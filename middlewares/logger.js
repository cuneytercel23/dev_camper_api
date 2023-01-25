
//@desc Logs request to console 
//* requestleri console'a yazdırma
//* bunu yazdık ama morgan daha mantıklı geldiğinden ötürü kullanmıcaz ama genede kalsın
const logger = (req,res,next) => {
    
    console.log(`${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl} `); //* method = get , protocol = http , host = localhost:5000, originalUrl = ne postu atarsak işte  api/v1/getuser falan :D
    next();
}
module.exports = logger ;