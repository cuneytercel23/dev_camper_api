const advancedResults = (model, populate) => async (req,res,next) => {

    //* filtering
  //? yaptığım örnek http://localhost:5000/api/v1/bootcamps?careers[in]=Business ve 2 tane cevap alabildim.

  let query ;

  //* copy req.query - query'de olan tüm şeyleri al kardeş
  const reqQuery = { ...req.query}

  //*fields to exclude - query'nin içinde olmasını istemediğimiz bir şeyler eklicez.
  const removeFields = ['select','sort','page','limit'];

  //* removeFields'i req.query içinden çıkarma işlemi
  removeFields.forEach(param => delete reqQuery[param]) //* remove field içinde gez ve reqQuery' içinde varsa yukardaki örnekte 'select' var. Onu sil.

  // console.log(reqQuery); // select ile sorgu yaparsam boş geliyor

  //* create query string
  let queryString = JSON.stringify(reqQuery); //* string olarak alıyoruz aşağıda değiştiricez.

 //* create operators ($gt , $lte etc)
  queryString = queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`); //* burda query'den aldığımız , örneğin gte veya in(İçinde var mı? fonksiyonudur.)'i aldık ya onu $in' e ceviriyor başına dolar koyuyor yani çünko mongodb ondan anlıyor. 
  //* ve ayrıca bu yukardaki fonksiyonla gt lte in falan ne seçersek onu kullanıyoruz ve queryStringe atıyoruz, ayrıca birden fazla filteringde yapabiliyoruz.


    //*finding resource normalde commandline olanı gibiydi ama populate'de duruma göre değişkenlik göstereceği için 'POPULATE HANDLE ' Kısımında yenisi
    // query = model.find(JSON.parse(queryString)).populate('courses'); //* courses populate'i ile, reverse populate with virtuals(bootcamp modelinde) olayını uygulamış oldum.
    query = model.find(JSON.parse(queryString))


  //* SELECT FIELDS - select diye bizim isinlendirdiğimiz alan varsa, sadece istediğim parametreleri çekebileceğimiz bir fonk yazıcaz.
  //* /api/v1/bootcamps?select=name,description -> name ve description bilgilerini gösteriyor sadece.
  if (req.query.select) { // eğer varsa
    const fields = req.query.select.split(',').join(' '); //* virgül yazılanları ayırdım. ve joinledim(farklı parçalara bölerek listeledik diyelim). 
    query = query.select(fields); //* select fonksiyonu kullanılarak, içindeki fieldleri query'e attım. Ve böylece select fonksiyonu sadece o parametreleri aramamı isteyecek. ve en aşağıda da
  } //* yukarıdaki finding resoursu aldıktan sonra bu kod bloğunu da kendisine işliyor eğer req.select var ise 

//* SORT FIELDS * select fields mevzuatının aynısı - buda sayıysa sayıya göre, tarihse tarihe göre, isimse alfabeye göre falan sıralıyor
if (req.query.sort) {
  const fields = req.query.select.split(',').join(' ');
  query = query.sort(fields)

}else {
  query = query.sort('-createdAt') //* en son kurulana göre aç
}


//* Pagination * sayfalama, limit = bi sayfada maks kaç değer var. page = mesela sayfa 1 dersek, ve limit 2 ise. bize ilk sayfa ilk 2 değeri gösterir. 2. sayfa diğer 2 değeri gösterir.
//* Asıl buranın mevzusu, mesela verileri göstericez diğer sayfaya geçiş yaptırıcaz ya onu ayarlıyoruz yani örneğin kullanıcı en aşşada görücek 2. sayfaya geç, sonra orası bitince 3.'e geç falan diye.

const page = parseInt(req.query.page, 10) || 1 //* soldaki ondalık sayı demekmiş :DDD , sağdakiler varsayılan değer 
const limit = parseInt(req.query.page, 10) || 1 //* maks 25(bize bağlı ne yazarsak işte :D) limit var bir sayfada 
const startIndex = (page-1) * limit //* startIndex de hesaplamayı yapar. yani hangi sayfada olduğumuzu ve kaç değer göstermemiz gerektiğini
const endIndex = page * limit //* endIndex değişkeni ise, hangi sayfada olduğumuzu ve her sayfada kaç adet sonuç istediğimizi kullanarak kaçıncı kayıta kadar göstermemiz gerektiğini hesaplar. Örneğin, ikinci sayfada olduğumuzu ve her sayfada 10 adet sonuç istediğimizi varsayarsak, endIndex değişkenine 20 atanır ve sorguda ilk 20 kayıt gösterilir.
const total = await model.countDocuments(); //* kayıt sayısını sayıyor

query = query.skip(startIndex).limit(limit)


    //*POPULATE HANDLE

    if (populate ) { //* yuakrda command line'a aldığım olayın parametreye cevrilmiş hali
        query = query.populate(populate);
    }

      //* execute query
      const results = await query;  


      //* Pagination Results

      const pagination = {}

      if(endIndex < total) { //* Eğer sonuncu index, total indexden kücükse aşağıdaki şeyi yap ve bunu res.statusde göstercez
        pagination.next = {
          page : page + 1,
          limit,
        }
      }


      if (startIndex > 0) { //* Eğer startIndex, 0'dan büyükse aşağıdaki şeyi yap ve bunu res.statusde göstercez.

        pagination.prev = {
          page : page -1 ,
          limit
        }
      }

      res.advancedResults = {
        success : true,
        count : results.length,
        pagination,
        data : results
      }
      next();

      //* Yukarıdaki ifli kısmınların özeti olarak ; 

      //* ilk sayfada bu geliyor, sadece next geliyor çünkü startIndex = 0 olduğu için, mantık olarak da bu ilk sayfa işte bi öncesi yok.
      //  "pagination": {
      //   "next": {
      //     "page": 2,
      //     "limit": 1
      // }
      //*2. sayfada hem next hem prev var, son sayfa da da next yo

     
} 
module.exports = advancedResults;