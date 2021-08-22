const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
var pdf = require('html-pdf');
const del = require('del');
const log = console.log;

//________________________________________
options = {
  "height": "297mm",
  "width": "210mm",
  "format": "A4",
  "border": {
    "top": "10mm",
    "right": "7mm",
    "bottom": "10mm",
    "left": "7mm",
  },
  "renderDelay": 10,
  timeout: 86400000,
}

// 폴더 생성
let all='';
//________________________________________


const getHtml = async (url) => {
  try {
    return await axios.get('https://artofproblemsolving.com'+url,
    { headers: { 'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.51 Safari/537.36`,
        "cookie": '_gaexp=GAX1.2.WVkI7FnIS7uzAuvgukoNgg.18949.0!w6SW_9RwSUaV6DWniVAhnw.18930.1; _fbp=fb.1.1629596800789.534233479; _gcl_au=1.1.323488408.1629596801; _hjid=02971953-aa30-499c-986d-b99133cc37a8; _gid=GA1.2.1787012143.1629596801; aopsuid=1; aopssid=7iCYxKNEYeOh16295983080328JfBbWhwiszIQ; _uetsid=cc237ac002ea11ec9be6011716722248; _uetvid=cc23e05002ea11ec900fb9052c1f1e25; _ga=GA1.1.1954802218.1629596801; _ga_NVWC1BELMR=GS1.1.1629596800.1.1.1629598328.41'
  }});
  } catch (error) {
    console.error(error);
  }
};

getHtml('/wiki/index.php/AIME_Problems_and_Solutions')
  .then(html => {
    let lists = [];
    const $ = cheerio.load(html.data);
    const $bodyList = $("table.wikitable tbody");

    $bodyList.each((i, e) => {
      $(e).find('tr td a').each((j, t) => {
        if (t.name == 'a') {
          lists.push({
            name: t.attribs.title,
            url: t.attribs.href
          })
        }
      })
    });
    return lists;
  }).then((lists)=>{
    lists.forEach(elem => {
      if (!fs.existsSync('./pdf')){
        del('./pdf');
        fs.mkdirSync('./pdf');
      }
      let dir = './pdf/'+elem.name.toString();
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }
    });
    return lists;
  })
  .then(async res => {
    log(res)
    res.forEach(e=>{
      if (![1,2].includes(res.indexOf(e))){
      for (let f = 1; f < 16; f++) {
        getHtml(e.url + '_Problems/Problem_' + f).then(html => {
          const $ = cheerio.load(html.data);
          const $bodyList = $("div.page-wrapper");
          $('div.toc').remove();
          $('span#See_Also').remove();
          $('div#main-footer').remove();
          $("table").last().remove()
          $("div.page-wrapper p").last().remove()
          $("div.printfooter").remove();
          $("div.catlinks").remove();
          htmldata='<!doctype html><html><head><title>김치볶음밥소고기</title></head><body>'+$bodyList.html().split('//').join('http://')+'</body></html>'
          fs.writeFileSync('index.html',htmldata);
          log(e.name+'-'+f);
          all+=$bodyList.html().split('//').join('http://')+'\n\n';
          pdf.create($bodyList.html().split('//').join('http://'), options).toFile('./pdf/'+e.name+'/'+e.name+'-'+f+'.pdf', function(err, res) {
            if (err) return console.log(err);
            console.log(res);
          });
        })
      }
    }
  })
  }).then(async () =>  {
    if(all!==''){pdf.create(all, options).toFile('./pdf/all.pdf', function(err, res) {
      if (err) return console.log(err);
      console.log(res);
    });}
  })