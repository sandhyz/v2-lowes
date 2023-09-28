'use strict'

const fs = require('fs')
const cron = require('node-cron')
//const current_datas = require('./data_lowes.json')
const vpn = require('./vpn/vpn')
const { parseString } = require('xml2js')
const { Sequelize, DataTypes } = require('sequelize')
const {
    setupPuppeteer,
    setupSequalize,
    getProxy,
    writeData,
    readData,
    deleteData,
    saveScrapeData,
    updateScrapeStatus,
    saveDataSKUBased,
    fetchAxios,
    pageRecreate,
    checkIp,
    messageBot
} = require('./helpers')
const cheerio = require('cheerio')
const args = require('minimist')(process.argv.slice(2))

const delay = (time) => {
    return new Promise((resolve) => {
        return setTimeout(function () {
            resolve()
        }, time)
    })
}

let responseInit = undefined
const Sequelize2 = setupSequalize()
const Op = Sequelize.Op;
const LowesModel = Sequelize2.define('v4_lowes_products', {
    sku: DataTypes.STRING,
    brand: DataTypes.STRING,
    product_name: DataTypes.STRING,
    price: DataTypes.DOUBLE,
    discount_price: DataTypes.DOUBLE,
    in_stock_status: DataTypes.INTEGER,
    created_at: DataTypes.STRING
})

const StatusModel = Sequelize2.define('scrape_product_progress', {
    brand_slug: DataTypes.STRING,
    name: DataTypes.STRING,
    status: DataTypes.STRING,
    created_at: DataTypes.STRING,
    updated_at: DataTypes.STRING
})

const DatasModel = Sequelize2.define('v4_product_datas', {
    sku: DataTypes.STRING,
    original_sku: DataTypes.STRING,
    brand_id: DataTypes.STRING,
    name: DataTypes.STRING,
    link: DataTypes.TEXT,
    status: DataTypes.STRING,
    created_at: DataTypes.STRING,
    updated_at: DataTypes.STRING
})

const StatusModelBatched = Sequelize2.define('scrape_product_progress_batched', {
    scraping_id: DataTypes.INTEGER,
    batch: DataTypes.INTEGER,
    status: DataTypes.STRING,
    created_at: DataTypes.STRING,
    updated_at: DataTypes.STRING
})

const LiveBaseModel = Sequelize2.define('v4_base_product', {
    scrape_id: DataTypes.STRING,
    key: DataTypes.STRING,
    link: DataTypes.TEXT,
    detail_category_id: DataTypes.INTEGER,
    deleted_at: DataTypes.STRING
})

const LiveDatasModel = Sequelize2.define('v4_product_data', {
    product_id: DataTypes.INTEGER,
    sku: DataTypes.STRING,
    lowes_price: DataTypes.DOUBLE
})

const getUsePuppeteer = async payload => {
    return new Promise(async (resolve, reject) => {
        const { headless, proxy, os, autoRefetch, url } = payload
        const args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu',
            // '--proxy-server=http://geonode_H2GkecyuP0-country-US:ddb75f1c-5598-4c0d-adc5-39c95676f0bd@rotating-residential.geonode.com:9000'
        ]

        try {
            let { browser, page } = await setupPuppeteer({
                headless,
                args,
                rootUrl: 'https://www.lowes.com/',
                excludedResourceTypes: ['font', 'media', 'manifest'],
                permissions: [],
                ignoreDefaultArgs: ['--enable-automation'],
                defaultViewport: null,
                executablePath:
                    os === 'mac'
                        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
                        : os === 'linux'
                            ? '/usr/bin/google-chrome'
                            : 'C:/Users/Aditya Wisnu/.cache/puppeteer/chrome/win64-1069273/chrome-win/chrome.exe'
            })

            console.log('puppeteer visit ' + url)
            // await page.setExtraHTTPHeaders({
            //     'Cookie': `dbidv2=fd2cc775-16dd-4ee9-bc19-53c82410129c; EPID=ZmQyY2M3NzUtMTZkZC00ZWU5LWJjMTktNTNjODI0MTAxMjlj; sn=1555; sd=%7B%22id%22%3A%221555%22%2C%22zip%22%3A%2290250%22%2C%22city%22%3A%22Hawthorne%22%2C%22state%22%3A%22CA%22%2C%22name%22%3A%22Hawthorne%20Lowe's%22%2C%22region%22%3A%228%22%7D; zipcode=90250; nearbyid=1555; zipstate=CA; salsify_session_id=b8f4a43c-33dc-424c-826a-d8478a978d14; _tt_enable_cookie=1; _ttp=2rPz0xjUwNuFH286EHQrR0Z5jY1; _gcl_au=1.1.88869522.1684806282; _pin_unauth=dWlkPU16azRaREZsWWpZdE1qQTBNaTAwWkdZekxUazVORGt0TnpnMVltTTFZalJpWkRabA; LPVID=g1YmE4NDA5YTllNGZjZjQ5; mdLogger=false; kampyle_userid=ee76-601a-f245-553b-4120-6248-a337-58b8; _fbp=fb.1.1684806299282.1038631869; BVBRANDID=f3be8cb4-3f21-4e47-9b33-ec3e4a3ea161; audience=DIY; crl8.fpcuid=9b3037e0-892d-4788-b301-d200cc8647c5; al_sess=FuA4EWsuT07UWryyq/3foG5vgiIcmpCcjVRVVsbLGemMg0jPlurWjQqC6Qg4l/vx; AMCV_5E00123F5245B2780A490D45%40AdobeOrg=-1303530583%7CMCIDTS%7C20244%7CMCMID%7C89426220999733435941296430116382877587%7CMCAAMLH-1686513901%7C9%7CMCAAMB-1686513901%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1685916301s%7CNONE%7CvVersion%7C3.3.0; AMCVS_5E00123F5245B2780A490D45%40AdobeOrg=1; discover-exp-1=abt11989b; IR_gbd=lowes.com; LPSID-22554410=5vQFbueWQ5CyFIE7dwUEfg; _clck=d3xnv|2|fc9|0|1238; region=central; bm_sz=E23377448B6FDF1D08CCCABD9CFA2DFC~YAAQtVkhF9G5LJCIAQAA5UmElBTmUJI7yqxtfaByoC3VoHS516zl1tGH4HH7Zs3ux/kWodqIy+b8VEDbJCmuO765u5VhkJMaBT6VMnUm384PoJ3mstyKOVRxflwUaZkBjsHnc+EiDkMXAMN5eH7/4w9Gjfj26B6NZxTfPTtPgCQwelSpiV7icSawPwqCULJ4KpcxFtkezi3HF4NsYN2BILWe2Bf948KDeZX3ZfOJHcSbuQl6CnLvcJZJwSNbjSCi0Imr5ZT/dqvKSbpf2ynS1nTYYdIuwqGAVWfQsuyfYrHY+koLQiUU26U42fBD45PVerkla1c8Q4ZTVw==~4601143~3159364; lowes-inhouse-chat=true; _lgsid=1686118880622; fs_uid=#Q8RZE#4653511165882368:6564619747864576:::#d1cb3c2e#/1716342269; TAsessionID=54a610bb-e5c5-429e-8a2a-241366469d36|NEW; ecrSessionId=4E3A043FCF5FE452BF6821FC1576EBEF; kampyleUserSession=1686121488097; kampyleUserSessionsCount=43; kampyleUserPercentile=80.64118537581663; BVBRANDSID=1ea7de95-63f0-4e1a-a586-cbd386fc1802; prodNumber=1; _uetsid=c79f19f004db11eea97179da2d59126e; _uetvid=6f21fac0f90b11ed80665bb50ea15b73; kampyleSessionPageCounter=6; _clsk=11npz67|1686122426496|19|0|u.clarity.ms/collect; AKA_A2=A; grs_search_token=HEAD:I3:1:NA:NA:186386816f091271a215dc943a73a65a; ak_bmsc=2AF504E7D89D92639B6587E019737D27~000000000000000000000000000000~YAAQtVkhF7bvOZCIAQAAjce/lBSSpiFz024yBf97xm+pEG8NZOQNCkM5dcfM2G+NDH8Dj226JT3BB6QeQZjpSret9ssLBsnTDTjSxc3QNeftZTAFXRUC5IdlAG3h94RbYI2+NJmYdCVvDMUka8tTXulIPvKfthGgZ88Z+N98Q2rbiJJWh2R9NS3KKQRvkJ/BMy95J9WG77A7b1YmfJozU6Jb4bzS1eqmXaPgQNFVFH0uydyy3RJj9jvgVMdEXxYJxN6sArDQty+qL+xHYe2w3+nufd412jUzIXaseW43nT9FNC2ayG2SOaKbO8cMA3Ek89WiMyNFuSSabnDIt0kFbuuqYyJZeFvI5ePzgJ2YtI/Nt++XXWCSMBqr8a458vObCdx6f1v6d4BMxLjEJpGcXL9sfltHZoTdjyz4gDK7gmtw/6bJex3RCLEikJZ/E1IdQCSQ0kSRXXAcn3ARczNzidAQVwNDxizQ8aicfzNSxwEswSGyk9MEZpqGAgSHyaXoqyuqXWAWP0SG3tIcGDzIk4VQlyxAUUT5YxvwicDYSgV7IBj1dRf92cvWBVrkuBl0; akavpau_cart=1686123082~id=89f842c2dce1cd4ccfa14770b21f7c72; p13n=%7B%22zipCode%22%3A%2290250%22%2C%22storeId%22%3A%221555%22%2C%22state%22%3A%22CA%22%2C%22audienceList%22%3A%5B%22WPRO%22%5D%7D; __gads=ID=1e09e820d36118ce:T=1684806272:RT=1686122785:S=ALNI_MbPfI5xZd5vTUcrQJne5If7dQJ5iA; __gpi=UID=0000098f9bf49fe8:T=1684806272:RT=1686122785:S=ALNI_MajGFl0j-8PMx7n-0lGaIKwMjHFjg; g_previous=%7B%22gpvPageLoadTime%22%3A%220.00%22%2C%22gpvPageScroll%22%3A%2215%7C15%7C0%7C6594%22%2C%22gpvSitesections%22%3A%22appliances%2Crefrigerators%2Ctop-freezer_refrigerators%22%2C%22gpvSiteId%22%3A%22desktop%22%2C%22gpvPageType%22%3A%22product-display%22%7D; IR_12374=1686122802724%7C0%7C1686122802724%7C%7C; IR_PI=69d66218-ed4f-11ed-9bf9-b348154b03ee%7C1686209202724; akavpau_default=1686123102~id=dbc1d9a66aa00fa203ca50b964f7098e; RT="z=1&dm=lowes.com&si=741dc614-a95f-4f97-8ab0-de028a5dbfac&ss=lild6ikd&sl=6&tt=2hiq&bcn=%2F%2F17de4c1f.akstat.io%2F&obo=1"; notice_behavior=implied,eu; akaalb_prod_dual=1686209204~op=PROD_GCP_EAST_CTRL_DFLT:PROD_DEFAULT_CTRL|~rv=16~m=PROD_DEFAULT_CTRL:0|~os=352fb8a62db4e37e16b221fb4cefd635~id=6855674bdbdddbd0fd477089fb92c21d; _abck=9394733630794E44E67CCFA58A853FDF~0~YAAQtVkhFwUGOpCIAQAAlTTAlApb04CanqMsJoZIS1EX8FTis18OLMQmcF4GS4AW94Nvxvwd+ID4y54Y4oZ7L7zGXKigKfCpMzVT8WSzq6dBZwkPK5ffJjWNBSGMmWiRlFd8McqBJqVi4NNftg08lI03kUZekVerdUdhUHLtkyMhdv96u/b0dYipVN8m104NRZkL3TwcNIfsENsgtFKV/e4FcjZPPZ+rPwF+QnfSm9auE8S2tEtOThsQL4HECmdLIk216J0ynKtqBst8rQSVrLcc6BOBRS2zPe38l+TiR2RxRAWs3qjoUjuuuL+aTL5YjRDvQOxsDqoszwgbK6VWDJUCH6jJP98Pb6pjFbLAN2ltJjHG0XJyWSkAxv1NFLQ7TmIrAyAv5JAByYMBsplIOsoc7iADPtdv5Z+NVMbF2A==~-1~-1~-1; bm_sv=69B3C1B90A6913FE2A54EEA7BE18D1F3~YAAQtVkhFwYGOpCIAQAAlTTAlBRqNYzcvkUsqW2WIGNxFHlIqlJxO9NXvG/TJfbEedP8+0HD06O/vmPi3tip1tUqByx9LsYmh93OGDU8p25lN6vju9ZRkpYlfFGqjIIByPkUk+zJ9gjRzufTNgE+BG4vSD1Pk1LyxFpAwxIysTbKvU/CRp9Xo8OjRIwd3ap3NlBTp6hXcgR9LRbApYJpQqg1Izjn9kzCO3Nhzv/KyI6njnOfG10hAprOFnaz/oY3XA==~1`,
            // })

            await page.goto(url, { timeout: 0 })

            let data = await page.$eval('*', body => body.innerHTML)

            await browser.close()

            resolve(data)
        } catch (err) {
            console.log(err)
            resolve(false)
        }
    })
}

let getProduct = async datas => {
    return new Promise(async (resolve, reject) => {
        try {
            let { modelWithPricetag, modelOnWebsite, dbDatas, batch, modelOnServer } = datas
            let rawdata = modelWithPricetag

            console.log('model with pricetag : ' + rawdata.length)
            console.log('model on website : ' + modelOnWebsite.length)
            modelOnWebsite.map((model, m) => {
                let searchModel = rawdata.findIndex(s => s.sku === model.product_id)
                if (searchModel == -1) {
                    rawdata.push({
                        sku: model.product_id,
                        brand_name: model.brand
                    })
                }
            })

            let perData = Math.ceil(rawdata.length / 5)
            let from = Math.ceil(perData * batch)
            let to = Math.ceil(perData + from)

            let dataPerPart = rawdata.slice(from, to)

            let tempData = dataPerPart.map((data) => {
                let searchModel = dbDatas.findIndex(s => s.sku === data.sku);
                if (searchModel != -1) {
                    return {
                        sku: data.sku,
                        original_sku: dbDatas[searchModel].original_sku != null ? dbDatas[searchModel].original_sku : data.sku,
                        brand: data.brand_name
                    }
                } else {
                    return {
                        sku: data.sku,
                        original_sku: data.sku,
                        brand: data.brand_name
                    }
                }
            })
            tempData.push({ sku: 'LRMVC2306S', original_sku: 'LRMVC2306S', brand: 'LG' })
            tempData.push({ sku: 'AZC5216LW', original_sku: 'AZC5216LW', brand: 'Amana' })

            tempData = tempData.reduce((result, item1) => {
                const matchingItem = modelOnServer.find(item2 => item1.sku === item2.model);
                if (matchingItem) {
                    result.push({ ...item1, ...matchingItem });
                }
                return result;
            }, []);
            console.log(tempData.length)
            resolve(tempData)
        } catch (err) {
            console.log(err)
        }
    })
}

let lcpLowes = async (payload, datas, loop, modelOnServer) => {
    const { headless, proxy, os, autoRefetch } = payload
    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // '--headless',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu'
    ]

    if (loop === 1) {
        if (await fs.existsSync(`${__dirname}/lowes/data-by-sku.json`))
            await deleteData(`${__dirname}/lowes/data-by-sku.json`)

        await writeData(
            `${__dirname}/lowes/data-by-sku.json`,
            datas.map(sku => ({
                sku: sku.sku,
                original_sku: sku.original_sku
            }))
        )

        await updateScrapeStatus({
            name: 'Lowes Per Sku',
            status: 'On Progress',
            batch: 1,
            Model: StatusModel,
            ModelBatched: StatusModelBatched
        })
    }


    const data = JSON.parse(await readData(`${__dirname}/lowes/data-by-sku.json`, 'utf8'))

    for (const [idx, item] of data.entries()) {
        if (!item.done) {
            try {
                console.log(item.sku)
                let modelId = modelOnServer.find(e => e.model == item.sku)
                console.log(modelId)
                console.log('search : ' + idx + ' - ' + modelId.model + ' - ' + modelId.itemId)


                let url = `https://www.lowes.com/pd/${modelId.itemId}/productdetail/1503/Guest/63011?nearByStore=1503&zipState=MO`


                let body = await getUsePuppeteer({
                    headless: headless,
                    proxy: proxy,
                    os: os,
                    autoRefetch: false,
                    url: url
                })

                if (body != false) {
                    let $ = cheerio.load(body)

                    let fetchAPI = $('body').text()
                    fetchAPI = JSON.parse(fetchAPI)
                    // console.log(JSON.parse(fetchAPI))
                    const parseDetail = fetchAPI.productDetails[modelId.itemId]
                    const dataLowes = parseDetail.product
                    const dataLowesPricing = parseDetail.mfePrice
                    // console.log(dataLowesPricing)
                    if (parseDetail) {

                        // status 
                        // out of stock 
                        let isOOS = dataLowes.isOOS
                        /// not available
                        let notAvailable = dataLowes.isNotAvailable
                        // currently not available
                        let isCDPNotAvailable = dataLowes.isCDPNotAvailable
                        // View Price In Cart + Ends May 17 (period)
                        let chartPeriode = false
                        let isInCart = false
                        
                        let price = dataLowesPricing == false ? 0 : dataLowesPricing.price.finalPriceForUi
                        if (typeof price == 'string') {
                            price = parseInt(price.replace(',', ''), 10)
                        }
                        
                        if (dataLowesPricing) {
                            if (dataLowesPricing.price.mapPriceMessage == "View Price In Cart") {
                                isInCart = true
                            }
                        }
                        
                        if(dataLowesPricing != false){

                            if (typeof dataLowesPricing.price.savings != 'undefined' && dataLowesPricing.price.mapPriceMessage == "View Price In Cart") {
                                chartPeriode = true
                            }
                            if (isOOS || notAvailable || isCDPNotAvailable || chartPeriode) {
                                data[idx].brand = dataLowes.brand != undefined ? dataLowes.brand : data[idx].brand
                                data[idx].product_name = dataLowes.description != undefined ? dataLowes.description : null
                                data[idx].price = 0
                                data[idx].discount_price = 0
                                data[idx].in_stock_status = 0
                                data[idx].done = true
                            } else {
                                data[idx].brand = dataLowes.brand != undefined ? dataLowes.brand : data[idx].brand,
                                    data[idx].product_name = dataLowes.description != undefined ? dataLowes.description : null,
                                    data[idx].price = price,
                                    data[idx].discount_price = price,
                                    data[idx].in_stock_status = 1,
                                    data[idx].done = true
                            }
                        } else {
                            data[idx].brand = dataLowes.brand != undefined ? dataLowes.brand : data[idx].brand
                            data[idx].product_name = dataLowes.description != undefined ? dataLowes.description : null
                            data[idx].price = 0
                            data[idx].discount_price = 0
                            data[idx].in_stock_status = 0
                            data[idx].done = true
                        }


                        if (isInCart == true)
                            data[idx].is_in_cart = isInCart


                        await writeData(`${__dirname}/lowes/data-by-sku.json`, data)
                    }


                }

                console.log('-----------Complete-----------')
            } catch (err) {
                console.log(err.message + ' - ' + err.statusCode)
                if (err.message == 'Navigation timeout of 30000 ms exceeded') {
                    data[idx].error = err.message
                } else {
                    try {
                        let checkError = await page.$('title')
                        if (checkError != null) {
                            let getalert = await page.evaluate(el => el.textContent, checkError)
                            console.log('Error : ' + getalert)
                            if (getalert == 'Access Denied') {
                                data[idx].error = 'Stopped here because of "Access Denied".'

                                await delay(10000)
                                console.log('Stop VPN')
                                await vpn.stop()
                                await delay(60000)
                                console.log('Start VPN')
                                await vpn.start()
                                await delay(600000)
                                let ip = await checkIp(1)
                                await delay(5000)
                            } else if (getalert == `"${item.sku}"` || getalert == `"${item.original_sku}"`) {
                                data[idx].note = 'No result found.'
                                data[idx].done = true
                            } else {
                                data[idx].error = err.message
                            }
                        } else {
                            data[idx].error = err.message
                        }
                    } catch (err2) {
                        data[idx].error = err.message
                    }

                    if (err.message.includes('ERR_NAME_NOT_RESOLVED')) {
                        await delay(10000)
                        console.log('Stop VPN')
                        await vpn.stop()
                        await delay(60000)
                        console.log('Start VPN')
                        await vpn.start()
                        await delay(600000)
                        let ip = await checkIp(1)
                        await delay(5000)
                    }
                }
                await writeData(`${__dirname}/lowes/data-by-sku.json`, data)
                await delay(5000)

            } finally {
                let numRecreate = 25
                if (idx == numRecreate) {
                    numRecreate = numRecreate += 25
                }
                await delay(1500)
            }

            await delay(1500)
        }
    }

    if (data.findIndex(item => !item.done) !== -1 && loop <= 3) {
        loop++
        await lcpLowes(payload, datas, loop)
    }
}

let start = async () => {
    const modelWithPricetag = await fetchAxios('https://appliance-api.com/api/v2/product/bind/all?api_key=amtBMXRNelROclRWTWVNQWY3Sk5XRzFDTDJNZVBnclgxUXBmV3owWXduUmJld3J1bGhRcXN4WGFiQmRKMmNBMQ==')
    const modelOnWebsite = await fetchAxios('https://appliance-api.com/api/v2/product/all?api_key=eGkrYXpZZzZSNkNrWjNuY0RxOGZqSitRKzU0UUhLTmdLZEt2ZUxsTlVSdlQrbStnMTgwSitpTjB2UWMyc2NRWQ==&type=data-feed&filter=settings')
    const modelOnServer = await fetchAxios('http://170.249.211.82:12388/api/lcp/modelLowes')
    const dbDatas = await DatasModel.findAll({
        attributes: ['sku', 'original_sku'],
        group: ['sku', 'original_sku'],
        raw: true
    }).then((data) => { return data })

    let datas = await getProduct({
        modelWithPricetag: modelWithPricetag,
        modelOnWebsite: modelOnWebsite,
        dbDatas: dbDatas,
        modelOnServer: modelOnServer,
        batch: 0
    })
    console.log('total data : ' + datas.length)

    await lcpLowes({
        headless: true,
        proxy: false,
        os: 'linux',
        autoRefetch: false
    }, datas, 1, modelOnServer)

    await saveDataSKUBased({
        name: 'Lowes Per Sku',
        data: JSON.parse(await readData(`${__dirname}/lowes/data-by-sku.json`)),
        Model: LowesModel,
        batch: 1,
        StatusModel: StatusModel,
        StatusModelBatched: StatusModelBatched
    })

    await messageBot('Lowes Already Done')
}

start()

exports.scrapeAll = async (req, res) => {
    start()
}
