const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
var pdf = require('html-pdf');
const del = require('del');

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
  }).then(async res => {
    console.log(res)
    let done=0;

    async function gen_pdf(n){
      if(n>=res.length){
        console.log({
          message: 'finished'
        })
      }else{
        gen(n).then((res)=>{
          setTimeout(() => {
            gen_pdf(n+1)
          }, 1000*60*4);
        })
      }
    }
    async function gen(num){
      const e=res[num]
      console.log(e)
      if (![0, 1].includes(res.indexOf(e))){
        let all=[];
        let allhtml=''
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
            let templog={
              name: e.name,
              url: e.url + '_Problems/Problem_' + f,
              num: f
            }
            console.log(templog)
            htmll=$bodyList.html().split('//').join('http://').split('https:http://').join('https://').split('"/wiki').join('"https://artofproblemsolving.com/wiki').split('https://wiki-images.artofproblemsolving.comhttp://').join('https://wiki-images.artofproblemsolving.com//')
            htmldata=htmll
            fs.writeFileSync('./html/'+e.name+'-'+f+'.html',htmldata)
            all.push(e.name+'-'+f+'.html')
            if(all.length==15){
              all=[];
              for(mn=1;mn<16;mn++){
                all.push(e.name+'-'+mn+'.html')
              }
              all.forEach((el)=>{
                html = fs.readFileSync('./html/'+el, "utf8")
                allhtml+=html+'\n\n\n'
                if(el==all[all.length-1]){
                  pdf.create(allhtml, options).toFile('./pdf/'+e.name+'.pdf', function(err, result) {
                    if (err) return console.log(err);
                    console.log(result);
                    done++
                    if(done==res.length-2){
                      const stop = new Date()
                      console.log(`${(stop - start)/1000} seconds`)
                    }
                  });
                }
              })
            }
          })
        }
      }
    }
    gen_pdf(2)
  })