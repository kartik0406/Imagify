var express             = require("express"),
   app                  = express(),
   fs                   = require("fs")
   bodyparser           = require("body-parser");
const {spawn}            = require('child_process');

app.use(bodyparser.urlencoded({extended: true}));


app.use("/public",express.static("public"));

app.set("view engine", "ejs");


app.get("/",function(req,res){
    res.render("index");
})
app.post("/encrypt",function(req,res){
    
  var filename=req.body.file1;
  
  var dataToSend;
  // spawn new child process to call the python script
 
  const python = spawn('python', ['encrypt.py',filename]);
  var filedata;
  fs.readFile('keys.txt', 'utf8', function(err, data) {
    if (err) throw err;
    console.log('OK: ' + filename);
    filedata=data.toString();
    console.log("\n"+filedata);
    
  });
  // collect data from script
  python.stdout.on('data', function (data) {
   console.log('Pipe data from python script ...');
   dataToSend = data.toString();
//    console.log(dataToSend);
    //  console.log(filedata);

       res.render("encrypt",{en_image:filename,key:filedata});
  
  });
  // in close event we are sure that stream from child process is closed
  python.on('close', (code) => {
  console.log(`child process close all stdio with code ${code}`);
  // send data to browser
//   res.send(dataToSend);
  });
})





app.post("/decrypt",function(req,res){
  
  var filename=req.body.file2;
   
  var dataToSend;
  // spawn new child process to call the python script
 
  const python1 = spawn('python', ['encrypt.py',filename]);
  // collect data from script
  python1.stdout.on('data', function (data) {
   console.log('Encrypt Pipe data from python script ...');
   dataToSend = data.toString();
   let i=0;
   for(;i<dataToSend.length;i++){
   if(dataToSend[i]==='h')
   break;
   }
   dataToSend=dataToSend.substring(2,i-3);
   dataToSend=dataToSend.replace(']','');
   dataToSend=dataToSend.replace('[',  ', -1 ,');
   
   dataToSend=dataToSend.split(",")
   for(let j=0;j<dataToSend.length;j++){
        dataToSend[j]=parseInt(dataToSend[j]);
   }
  
   console.log(dataToSend);


   var dataToSend1;
   // spawn new child process to call the python script
  
   const python2 = spawn('python', ['decrypt.py',filename,JSON.stringify(dataToSend.splice(0,dataToSend.indexOf(-1))),JSON.stringify(dataToSend.splice(dataToSend.indexOf(-1)+1,dataToSend.length))]);
   // collect data from script
   python2.stdout.on('data', function (data1) {
    console.log('Decrypt Pipe data from python script ...');
    dataToSend1 = data1.toString();
    console.log(dataToSend1);
     
        res.render("decrypt",{dec_image:filename});
   
   });
   // in close event we are sure that stream from child process is closed
   python2.on('close', (code1) => {
   console.log(`Inner child process close all stdio with code ${code1}`);
   // send data to browser
  //  res.send(dataToSend1);
   });



  
  });
  // in close event we are sure that stream from child process is closed
  python1.on('close', (code) => {
  console.log(`Outer child process close all stdio with code ${code}`);
  // send data to browser
  // res.send(dataToSend);
  });

})





let port=process.env.PORT;
if(port==null||port==""){
  port=9000;
}
app.listen(port, function () {
  console.log("Server started successfully at port 9000");
});
