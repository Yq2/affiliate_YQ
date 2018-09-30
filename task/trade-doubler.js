const async=require('async');
const cheerio = require('cheerio');
const request=require('request');
const fs=require('fs');
const unzip = require("unzip");
const xlsx = require('node-xlsx');
const path=require('path');
const baseUrl='https://login.tradedoubler.com';
const Dbapi = require('../api/dbapi');
const Function=require('../api/function.js');
let $headers = {
    'accept-language':'zh-CN,zh;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36'
};
const loginUrl='https://login.tradedoubler.com/pan/login';
const homeUrl='https://login.tradedoubler.com/pan/mStartPage.action?resetMenu=true';
const getExcelUrl='https://login.tradedoubler.com/pan/mReport3Internal.action';

const USERS = {
    'tradedoubler.it@sammydress.com1': {
        pwd: '123123123',
        dateType:0,
        siteType:0,
        sitesType:['Dresslily UK (GB)','Rosegal IT (IT)','Zaful IT (IT)']
    },
    'afiliados.pt@fshion.me': {
        pwd: 'TDfsion2017',
        dateType:0,
        siteType:0
    },
    'tradedoubler.fr@fshion.me': {
        pwd: 'sdrgdztd%123',
        dateType:1,
        siteType:0
    },
    'tradedoubler.de@rosegal.com': {
        pwd: '8354619',
        dateType:0,
        siteType:0
    },
    'tradedoubler.de@rosegal.com1': {
        pwd: '806957@1',
        dateType:0,
        siteType:0
    },
    'afiliado.es@fshion.me':{
        pwd:'452017sz',
        dateType:0,
        siteType:1
    }
};
let users=[];
let cookieObj={};

function TradeDoubler() {

    this.getTransacion=function (user,date,callback) {
        if (!USERS[user.account]) {
            console.log('!!!user not exist user=',user);
            callback(null);
        } else {
            if (date) {
                if (USERS[user.account].dateType===1) {
                    let startDate=date.startDate.split('/');
                    let endDate=date.endDate.split('/');
                    date.startDate=startDate[1]+'/'+startDate[0]+'/'+startDate[2];
                    date.endDate=endDate[1]+'/'+endDate[0]+'/'+endDate[2];
                }
            } else {
                date=startEndDate(user,-3, 0);
            }
            console.log('date=',date);
            async.waterfall([
                function (cb) {
                    login(user,function (err) {
                        cb(err);
                    });
                },function (cb) {
                    async.eachSeries(USERS[user.account].sites,function (site,cb) {
                        getTransacion(user,date,site,function (err) {
                            cb(err);
                        });
                    },function (err) {
                        cb(err);
                    });
                }
            ],function (err) {
                callback(err);
            });
        }
    };

    function login(user,callback) {
        console.log('login user=',user.account);
        async.waterfall([
            function (cb) {
                setTimeout(function () {
                    cb();
                },3000)
            },
            function (cb) {
                let headers=$headers;
                headers['Content-Type']='application/x-www-form-urlencoded';
                headers['Referer']='https://login.tradedoubler.com/public/aLogin.action?language=en&country=GB';
                let loginParam={
                    url:loginUrl,
                    method:'POST',
                    form:{
                        j_username:user.account,
                        j_password:user.pwd
                    },
                    headers:headers
                };
                request(loginParam,function (err,res,body) {
                    let setCookie;
                    try {
                        setCookie=res.headers['set-cookie'];
                        cookieObj=parseResCookie(cookieObj,setCookie);
                    } catch (e) {
                        if (e) {
                            console.info(body);
                            console.log('login error ',e);
                        }
                    }
                    cb(null);
                });
            },
            function (cb) {
                let headers=$headers;
                headers['Referer']='https://login.tradedoubler.com/public/aLogin.action';
                headers['Cookie']=parseReqCookie(cookieObj);
                let param={
                    url:homeUrl,
                    method:'GET',
                    headers:headers
                };
                let sites=[];
                request(param,function (err,res,body) {
                    if (err) {
                        console.log('!!! login error',err);
                    }
                    let setCookie;
                    try {
                        setCookie=res.headers['set-cookie'];
                    } catch (e) {
                        setCookie='';
                    }
                    if (setCookie) {
                        cookieObj=parseResCookie(cookieObj,setCookie);
                    }
                    let $;
                    try {
                       $ =cheerio.load(body);
                    } catch (e) {
                        if (e) {
                            console.log('get sites error ',e);
                            console.log(body)
                        }
                    }
                    if (!$) {
                        console.log('get sites parse error ');
                        return cb('parse body error');
                    }
                    $("select[id='programChooserId']").find("option").each(function () {
                        let siteClass='';
                        if (USERS[user.account].siteType ===0) {
                            siteClass='select_active';
                        } else {
                            siteClass='select_inactive';
                        }
                        if ($(this).attr('class') ===siteClass) {
                            let site={};
                            site.id=$(this).attr("value");
                            let _=$(this).text().trim();
                            site.name=_?_:'未知';
                            if (USERS[user.account].sitesType) {
                                let sitesType=USERS[user.account].sitesType;
                                for (let $=0;$<sitesType.length ;$++) {
                                    if (site.name === sitesType[$]) {
                                        sites.push(site);
                                    }
                                }
                            } else {
                                sites.push(site);
                            }
                        }
                    });
                    if (!USERS[user.account].sites) {
                        USERS[user.account].sites=sites;
                        console.log('sites==',sites);
                    }
                    cb(err)
                });
            }
        ],function (err) {
            callback(err);
        });
    }

    function startEndDate(user,stratNum, endNum) {
        let startEndDate = Function.startEndDate(stratNum, endNum);
        let time_='';
        if (USERS[user.account].dateType ===1) {
            time_= {
                startDate: (startEndDate.startday <10 ? '0'+startEndDate.startday :startEndDate.startday) + '/'
                + (startEndDate.startmonth <10 ? '0' +startEndDate.startmonth : startEndDate.startmonth) + '/' + startEndDate.startyear,
                endDate: (startEndDate.endday <10 ? '0'+startEndDate.endday:startEndDate.endday) + '/'
                + (startEndDate.endmonth <10 ? '0'+startEndDate.endmonth : startEndDate.endmonth) + '/' + startEndDate.endyear
            };
        } else {
            time_= {
                startDate: (startEndDate.startmonth <10 ? '0' +startEndDate.startmonth : startEndDate.startmonth) + '/'
                + startEndDate.startday + '/' + startEndDate.startyear,
                endDate: (startEndDate.endmonth <10 ? '0'+startEndDate.endmonth : startEndDate.endmonth) + '/'
                + startEndDate.endday + '/' + startEndDate.endyear
            };
        }
        return time_;
    }

    function getTransacion(user,date,site,callback) {
        console.log('+++getTransacion');
        async.waterfall([
            function (cb) {
                // login(user,function (err) {
                //     cb(err);
                // });
                cb();
            },
            function (cb) {
                let headers=$headers;
                headers["Content-Type"]="application/x-www-form-urlencoded";
                headers['Cookie']=parseReqCookie(cookieObj);
                headers['Origin']='https://login.tradedoubler.com';
                headers['Connection']='keep-alive';
                headers['Referer']='https://login.tradedoubler.com/pan/mReport3Selection.action?reportName=mMerchantSaleAndLeadBreakdownReport';
                let reqForm={
                    reportName:'mMerchantSaleAndLeadBreakdownReport',
                    tabMenuName:'',
                    isPostBack:'',
                    showAdvanced:true,
                    showFavorite:false,
                    run_as_organization_id:'',
                    minRelativeIntervalStartTime:0,
                    maxIntervalSize:12,
                    interval:'MONTHS',
                    reportPrograms:'',
                    reportTitleTextKey:'REPORT3_SERVICE_REPORTS_MMERCHANTSALESANDLEADBREAKDOWNREPORT_TITLE',
                    setColumns:true,
                    latestDayToExecute:0,
                    allPrograms:false,
                    programId:site.id,
                    eventId:5,
                    viewType:1,
                    geId:'',
                    segmentId:'',
                    currencyId:'USD',
                    period:'custom_period',
                    startDate:date.startDate,
                    endDate:date.endDate,
                    filterOnTimeHrsInterval:false,
                    affiliateId:'',
                    includeMobile:1,
                    autoCheckbox:'useMetricColumn',
                    customKeyMetricCount:0,
                    'metric1.name':'',
                    'metric1.midFactor':'',
                    'metric1.midOperator':'/',
                    'metric1.columnName1':'organizationId',
                    'metric1.operator1':'/',
                    'metric1.columnName2':'organizationId',
                    'metric1.lastOperator':'/',
                    'metric1.factor':'',
                    'metric1.summaryType':'NONE',
                    format:'EXCEL',
                    separator:'',
                    dateType:1,
                    favoriteId:'',
                    favoriteName:'',
                    favoriteDescription:'',
                };
                let reqParam={
                    url:getExcelUrl,
                    method:'POST',
                    form:reqForm,
                    headers:headers
                };
                let filePath='file/'+new Date().getTime()+'.xls';
                request(reqParam,function (err,res,body) {
                    if (err) {
                        console.log('!!! getExcelUrl error',err);
                    }
                    let location=res.headers.location;
                    let $=cheerio.load(body);
                    let href='';
                    href=$("p").find("a").attr('href');
                    if (!href) {
                        console.log('***** response stream download ****');
                        cb('stream',filePath);
                    } else {
                        let completeHref=baseUrl+href;
                        console.log('**** response href goto ****');
                        console.log('completeHref=',completeHref);
                        cb('href',completeHref);
                    }
                }).pipe(fs.createWriteStream(filePath));
            }
        ],function (err,arg) {
            console.log('callback type =',err,'arg=',arg);
            if (err ==='stream') {
                let basePath='../';
                setTimeout(function () {
                    readExcel(user,date,site,basePath,arg,function (err) {
                        callback(err);
                    });
                },5000);
            } else if(err === 'href') {
                handleHref(user,date,site,arg,function (err) {
                    callback(err);
                });
            } else {
                callback(err);
            }
        });
    }

    function handleHref(user,date,site,completeHref,callback) {
        async.waterfall([
            function (cb) {
                createZip(completeHref,function (err,zipPath) {
                    cb(err,zipPath);
                });
            },
            function (zipPath,cb) {
                unZip(zipPath,function (err,unzipFilePath) {
                    cb(err,unzipFilePath);
                });
            },
            function (unzipFilePath,cb) {
                let basePath='../file/';
                readExcel(user,date,site,basePath,unzipFilePath,function (err) {
                    cb(err);
                });
            }
        ],function (err) {
            callback(err);
        });
    }

    function createZip(completeHref,cb) {
        if (!completeHref) {
            console.log('completeHref=',completeHref,'typeof=',typeof completeHref);
            return cb('createZip completeHref error');
        }
        let _=completeHref.split("/");
        let length=_.length;
        let zipPath=_[length-1];
        zipPath='file/'+zipPath;
        request(completeHref,function (err,res,body) {
            cb(err,zipPath);
        }).pipe(fs.createWriteStream(zipPath));
    }

    function unZip(zipPath,cb) {
        let unzipFilePath=zipPath.slice(5,-4);
        //解压缩不是同步的
        fs.createReadStream(zipPath).pipe(unzip.Extract({ path: 'file/' }));
        setTimeout(function () {
            cb(null,unzipFilePath);
        },5000);
    }

    function readExcel(user,date,site,basePath,unzipFilePath,cb) {

        let parsePath=path.join(__dirname, basePath+unzipFilePath);
        let obj;
        try {
            obj=xlsx.parse(parsePath);
        } catch (e) {
            console.log('user=',user.account,'site id=',site.id,'readExcel error','parsePath=',parsePath);
            obj=null;
        }
        if (obj) {
            let excelArray=obj[0].data;
            let results=[];
            for (let i=9;i<excelArray.length-1;i++) {
                if (excelArray[i][7] && excelArray[i][7]!==' ') {
                    let item={};
                    item.order_amount=parseFloat(excelArray[i][23]);
                    item.spend=parseFloat(excelArray[i][32]);
                    item.order_sn=excelArray[i][7];
                    let date='';
                    let time_str=excelArray[i][5];
                    if (USERS[user.account].dateType ===1) {
                        date = new Date(time_str);
                    } else {
                        date = new Date(1900, 0, time_str-1);
                    }
                    item.ondate=date.toLocaleString();
                    item.website=excelArray[i][1];
                    item.update=new Date().toLocaleString();
                    if (item.ondate==="Invalid Date") {
                        item.ondate=new Date(time_str).toLocaleString();
                    }
                    if (item.ondate==="Invalid Date") {
                        console.warn("!!! item.ondate Invalid Date");
                    }
                    if (!isNaN(item.order_amount) && !isNaN(item.spend)) {
                        results.push(item);
                    } else {
                        console.log('!!!NaN item=',JSON.stringify(item));
                    }
                }
            }
            console.log('user=',user.account,'date=',date,'site=',site.name);
            console.log('results.length=',results.length,results.slice(-5));
            let flag=true;
            let sendConf=300;
            async.whilst(
                function () {
                    return flag;
                },
                function (fn_cb) {
                    if (results.length > sendConf) {
                        let buff=results.splice(0,sendConf);
                        sendMsg_(user,buff,function (err) {
                            fn_cb(err);
                        });
                    } else {
                        flag=false;
                        return fn_cb(null)
                    }
                },
                function (err) {
                    if (err) console.log(err);
                    sendMsg_(user,results,function (error) {
                        cb(error);
                    });
                });

            function sendMsg_(user,results,cb) {
                Dbapi.sendMsg({
                    json: {
                        "actionid": 133,
                        "noat": true,
                        _aff_accountid: user._aff_accountid,
                        linkid: user.linkid,
                        "orders": results,
                        is_hadamount: 1,
                    }
                }, function (err, result) {
                    console.log('Dbapi.sendMsg err', err, result);
                    cb(null);
                });
            }
        } else {
            cb(null);
        }
    }

    let parseResCookie=function (cookieObj, cookies) {
        if (!cookies) {
            return cookieObj;
        }
        for (let $=0; $<cookies.length ;$++) {
            let cookie=cookies[$];
            let list=cookie.split(';');
            for (let i=0; i<1; i++) {
                let pair=list[i].split('=');
                cookieObj[pair[0].trim()]=pair[1];
            }
        }
        return cookieObj;
    };

    let parseReqCookie=function (cookieObj) {
        let cookieReqStr='';
        for (let key in cookieObj) {
            cookieReqStr=cookieReqStr+key+'='+cookieObj[key]+'; ';
        }
        let lastIndex=cookieReqStr.lastIndexOf(';');
        cookieReqStr=cookieReqStr.substr(0,lastIndex);
        return cookieReqStr;
    };
}

module.exports=new TradeDoubler();