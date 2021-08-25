const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
var pdf = require('html-pdf');
const del = require('del');
const log = console.log;

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
const start = Date.now()

async function getBase64(url) {
  return axios
    .get(url, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.51 Safari/537.36`,
        "cookie": '_gaexp=GAX1.2.WVkI7FnIS7uzAuvgukoNgg.18949.0!w6SW_9RwSUaV6DWniVAhnw.18930.1; _fbp=fb.1.1629596800789.534233479; _gcl_au=1.1.323488408.1629596801; _hjid=02971953-aa30-499c-986d-b99133cc37a8; _gid=GA1.2.1787012143.1629596801; aopsuid=1; aopssid=7iCYxKNEYeOh16295983080328JfBbWhwiszIQ; _uetsid=cc237ac002ea11ec9be6011716722248; _uetvid=cc23e05002ea11ec900fb9052c1f1e25; _ga=GA1.1.1954802218.1629596801; _ga_NVWC1BELMR=GS1.1.1629596800.1.1.1629598328.41'
  }
    })
    .then(response => Buffer.from(response.data, 'binary').toString('base64'))
    .catch(err=>{
      console.error(err)
    })
}

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
      if (!fs.existsSync('./html')){
        del('./html');
        fs.mkdirSync('./html');
      }
      /*
      let dir = './pdf/'+elem.name.toString();
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
      }*/
    });
    return lists;
  })
  .then(async res => {
    log(res)
    let done=0;
    res=[null,null,res[2]]
    res.forEach(async e=>{
      if (![0, 1].includes(res.indexOf(e))){
      let all=[];
      let allhtml=''
      for (let f = 1; f < 2; f++) {
        getHtml(e.url + '_Problems/Problem_' + f).then(async html => {
          const $ = cheerio.load(html.data);
          const $bodyList = $("div.page-wrapper");
          $('div.toc').remove();
          $('span#See_Also').remove();
          $('div#main-footer').remove();
          $("table").last().remove()
          $("div.page-wrapper p").last().remove()
          $("div.printfooter").remove();
          $("div.catlinks").remove();
          //htmldata='<!doctype html><html><head><title>김치볶음밥소고기</title></head><body>'+$bodyList.html().split('//').join('http://')+'</body></html>'
          //fs.writeFileSync('index.html',htmldata);
          log(e.name+'-'+f);
          htmll=$bodyList.html().split('//').join('http://').split('https:http://').join('https://').split('"/wiki').join('"https://artofproblemsolving.com/wiki').split('https://wiki-images.artofproblemsolving.comhttp://').join('https://wiki-images.artofproblemsolving.com//')
          htmlli=[]
          htmll=htmll.split('"')
          let done=0;
          for(j=0;j<htmll.length;j++){
            elem=htmll[j]
            //console.log(elem)
            if(elem.endsWith('.png')){
              console.log(elem)
              htmlli[j]=elem
              getBase64(elem).then(res=>{
                temp=res.toString()
                htmlli[j]=temp;
                //console.log(htmlli[j])
              }).then(()=>{
                done++
                if(htmll.length==done){
                  console.log(htmll.length, htmlli.length,done)
                  htmldata=htmlli.join('"')
                  fs.writeFileSync('./html/'+e.name+'-'+f+'.html',htmldata)
                }
              })
            }else{
              htmlli[j]=elem;
              done++
              if(done==htmll.length){
                console.log(htmll.length, htmlli.length,done)
                htmldata=htmlli.join('"')
                fs.writeFileSync('./html/'+e.name+'-'+f+'.html',htmldata)
              }
            }
          }
        })
      }
    }
  })
  })