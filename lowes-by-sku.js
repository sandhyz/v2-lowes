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
const argv = require('minimist')(process.argv.slice(2))

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

let getProduct = async datas => {
	return new Promise(async (resolve, reject) => {
		try {
			let { modelWithPricetag, modelOnWebsite, batch } = datas
			let rawdata = modelOnWebsite

			console.log('model with pricetag : ' + rawdata.length)
			console.log('model on website : ' + modelOnWebsite.length)
			modelWithPricetag.map((model, m) => {
				let searchModel = rawdata.findIndex(s => s.sku === model.product_id)
				if (searchModel == -1) {
					rawdata.push({
						sku: model.product_id,
						original_sku: model.product_id,
						brand: model.brand
					})
				}
			})

			let perData = Math.ceil(rawdata.length / 5)
			let from = Math.ceil(perData * batch)
			let to = Math.ceil(perData + from)
			let tempData = rawdata.slice(from, to)
			tempData = tempData.map(item => ({
				sku: item.product_id,
				original_sku: item.product_id,
				brand: item.brand
			  }));

			// let tempData = dataPerPart.map((data) => {
			// 	let searchModel = dbDatas.findIndex(s => s.sku === data.sku);
			// 	if (searchModel != -1) {
			// 		return {
			// 			sku: data.sku,
			// 			original_sku: dbDatas[searchModel].original_sku != null ? dbDatas[searchModel].original_sku : data.sku,
			// 			brand: data.brand_name
			// 		}
			// 	} else {
			// 		return {
			// 			sku: data.sku,
			// 			original_sku: data.sku,
			// 			brand: data.brand_name
			// 		}
			// 	}
			// })
			// tempData.push({ sku: 'LRMVC2306S', original_sku: 'LRMVC2306S', brand: 'LG' })
			// tempData.push({ sku: 'AZC5216LW', original_sku: 'AZC5216LW', brand: 'Amana' })
			// tempData = [{sku: 'KCGC558JSS', original_sku: 'KCGC558JSS', brand: 'KitchenAid'}]
			console.log(tempData.length)
			resolve(tempData)
		} catch (err) {
			console.log(err)
		}
	})
}

const setLowesStore = async page => {
	try {
		console.log('setting store..')
		await page.goto(`https://www.lowes.com/store`)
		await delay(9000)
		await page.waitForSelector('input[placeholder="Zip Code, City, State or Store #"]')
		await page.click('input[placeholder="Zip Code, City, State or Store #"]')
		await page.waitForTimeout(200)
		await page.type('input[placeholder="Zip Code, City, State or Store #"]', 'ballwin', {
			delay: 100
		})

		await page.waitForTimeout(200)
		await page.keyboard.press('Enter')
		await page.waitForSelector('button[data-storenumber="1503"]')
		await page.waitForTimeout(200)
		await page.click('button[data-storenumber="1503"]')
		await delay(5000)

		//setting zip code
		//await page.click('#headerApp > div:nth-child(2) > div > div.sc-105kpm3-10.ikjBHq > header > div.sc-105kpm3-2.kngyuR > div > div.sc-1ecnx9w-5.erLXxh > div > a')
		await page.click('#headerApp > div:nth-child(2) > div > div.sc-105kpm3-10.ikjBHq > header > div.sc-105kpm3-2.kngyuR > div > div.sc-1ecnx9w-5.erLXxh > div > a')
		await page.waitForSelector('input[placeholder="Enter Zip Code"]')
		await page.click('input[placeholder="Enter Zip Code"]')
		await page.waitForTimeout(200)
		await page.type('input[placeholder="Enter Zip Code"]', '63011', {
			delay: 100
		})
		await page.keyboard.press('Enter')

		await page.waitForTimeout(5000)
	} catch (err) {
		console.log(err.message)
		await setLowesStore(page)
	}
}

let lcpLowes = async (payload, datas, loop) => {
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

	// if (proxy) args.push('--proxy-server=premium-residential.geonode.com:9000')

	let { browser, page } = await setupPuppeteer({
		headless,
		args,
		rootUrl: 'https://www.lowes.com/',
		permissions: [],
		ignoreDefaultArgs: ['--enable-automation'],
		defaultViewport: null,
		executablePath:
			os === 'mac'
				? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
				: os === 'linux'
					? '/usr/bin/google-chrome'
					: 'C:/Users/yudha/.cache/puppeteer/chrome/win64-115.0.5790.170/chrome-win64/chrome.exe'
	})

	if (loop === 1) {
		if (await fs.existsSync(`${__dirname}/lowes/data-by-sku.json`))
			await deleteData(`${__dirname}/lowes/data-by-sku.json`)

		// if(proxy){
		//     await page.authenticate({
		//         username: 'geonode_H2GkecyuP0-country-US',
		//         password: 'ddb75f1c-5598-4c0d-adc5-39c95676f0bd'
		//     })
		// }

		await writeData(
			`${__dirname}/lowes/data-by-sku.json`,
			datas.map(sku => ({
				sku: sku.sku,
				original_sku: sku.original_sku,
				brand: sku.brand
			}))
		)
	}

	await setLowesStore(page)
	if (loop === 1) {
		await updateScrapeStatus({
			name: 'Lowes Per Sku',
			status: 'On Progress',
			batch: argv.batch,
			Model: StatusModel,
			ModelBatched: StatusModelBatched
		})
	}

	const data = JSON.parse(await readData(`${__dirname}/lowes/data-by-sku.json`, 'utf8'))

	for (const [idx, item] of data.entries()) {
		if (!item.done) {
			try {
				// await delay(2000)
				console.log('search : ' + idx + ' - ' + item.sku + ' - ' + item.original_sku)

				// if(proxy){
				//     await page.authenticate({
				//         username: 'geonode_H2GkecyuP0-country-US',
				//         password: 'ddb75f1c-5598-4c0d-adc5-39c95676f0bd'
				//     })
				// }

				let skuForSearch = item.original_sku != null ? item.original_sku : item.sku
				await page.waitForSelector('input[id="search-query"]')

				const input = await page.$('input[id="search-query"]')
				await input.click({ clickCount: 3 })
				await page.waitForTimeout(200)
				await input.type(skuForSearch, { delay: 100 })

				await page.waitForTimeout(200)
				await page.keyboard.press('Enter')
				await page.waitForNavigation({ timeout: 0 })

				await page.waitForTimeout(3000)

				let h1 = await page.$('h1')
				let checkh1 = await page.evaluate(el => el.textContent, h1)

				let element = await page.$('div.item-model > p:nth-child(2)')
				
				if (element != null) {
					let checkModel = await page.$('div.item-model > p:nth-child(2)') != null ? await page.evaluate(() => document.querySelector('div.item-model > p:nth-child(2)').innerHTML) : ''

					if (checkModel.includes(item.sku.toUpperCase()) || checkModel.includes(item.original_sku)) {
						
						let elProduct = await page.$('div[data-type="PRODUCT"]')
						let brand = await page.evaluate(el => el.getAttribute("data-brand"), elProduct)
						let product_name = await page.evaluate(el => el.getAttribute("data-description"), elProduct)
						let in_stock_status = 1

						let elPrice = await page.$('div.PriceUIstyles__WrapperComponentInner-sc-14j12uk-1.fFMWYd > span')
						if (elPrice != undefined && elPrice != null) {
							let price = await page.evaluate(el => el.textContent, elPrice)
							if (price != '' && price != undefined && price != null) {
								if (price.trim() == 'View Price In Cart' || price.trim() == 'View Lower Price In Cart') {
									if (await page.$('div.mapEndDate > div > span > span[data-testid="savings-end-date"]') != null && await page.$('div.mapEndDate > div > span > span[data-testid="savings-end-date"]') != undefined) {
										in_stock_status = 0
									}
									await page.click('div.atc-buy-box > div > div > button')
									await page.waitForSelector('div[data-selector="art-fl-totalPriceValue"]')
									let cartPrice = await page.evaluate(() => document.querySelector('div[data-selector="art-fl-totalPriceValue"] > div > span').textContent)
									data[idx].price = cartPrice != null && cartPrice != undefined ? parseFloat(cartPrice.trim().replace('$', '').replace(',', '')).toFixed(2) : 0
								} else if (price.includes('Striked through price')) {
									let priceF = price.replace('Striked through price', '').trim().replace('$', '').replace(',', '')
									data[idx].price = parseFloat(priceF).toFixed(2)
									data[idx].note = 'dashed price'
									in_stock_status = 0
								} else {
									let priceF = price.trim().replace('$', '').replace(',', '')
									data[idx].price = parseFloat(priceF).toFixed(2)
								}
							} else {
								data[idx].price = 0
							}
						} else {
							data[idx].price = 0
						}

						// out of stock
						if (await page.$('span.oosStock') != undefined && await page.$('span.oosStock') != null) {
							if (await page.evaluate(el => el.textContent, await page.$('span.oosStock')) != undefined && await page.evaluate(el => el.textContent, await page.$('span.oosStock')) != '') {
								in_stock_status = 0
							}
						}
						// unavailable
						if (await page.$('div.warnMessage') != undefined && await page.$('div.warnMessage') != null) {
							let unavailable = await page.evaluate(el => el.textContent, await page.$('div.warnMessage'))
							if (unavailable.includes('THIS ITEM IS CURRENTLY UNAVAILABLE')) {
								in_stock_status = 0
							}
						}
						// unavailable online
						if (await page.$('text/This item is unavailable for purchase online') != undefined && await page.$('text/This item is unavailable for purchase online') != null) {
							let unavailableOnline = await page.evaluate(el => el.textContent, await page.$('text/This item is unavailable for purchase online'))
							if (unavailableOnline != undefined && unavailableOnline != '') {
								in_stock_status = 0
							}
						}

						if (data[idx].brand != '') {
							if (data[idx].brand.toUpperCase() != brand.trim().toUpperCase() && !brand.toUpperCase().includes(data[idx].brand.toUpperCase())) {
								data[idx].price = 0
							}
						}

						data[idx].brand = brand
						data[idx].product_name = product_name
						data[idx].in_stock_status = in_stock_status

						data[idx].done = true
						console.log('  -> ' + data[idx].price)
					} else {
						data[idx].note = 'No result found.'
						data[idx].done = true
					}

					await writeData(`${__dirname}/lowes/data-by-sku.json`, data)
				} else {
					const lists = await page.evaluate(() => {
						const element = Array.from(document.querySelectorAll('div[data-selector="prd-description-zone"]'))
						return element.map(list => {
							return list.innerHTML
						});
					});

					let selectedList = undefined
					lists.map(list => {
						if (list.match(`Model #<!-- -->${item.sku}<`) || list.match(`Model #<!-- -->${item.original_sku}<`) || list.match(`Model #${item.sku}<`) || list.match(`Model #${item.original_sku}<`)) {
							selectedList = list
						}
					})
					if (selectedList != undefined) {
						await page.goto(`data:text/html,${selectedList}`);
						let a = await page.$('div > a')
						let url = await page.evaluate(el => el.getAttribute("href"), a)

						await page.goto(`https://www.lowes.com${url}`, { timeout: 0 })
						await page.waitForTimeout(3000)
						let checkModel = await page.$('div.item-model > p:nth-child(2)') != null ? await page.evaluate(() => document.querySelector('div.item-model > p:nth-child(2)').innerHTML) : ''
						if (checkModel.includes(item.sku) || checkModel.includes(item.original_sku)) {
							let elProduct = await page.$('div[data-type="PRODUCT"]')
							let brand = await page.evaluate(el => el.getAttribute("data-brand"), elProduct)
							let product_name = await page.evaluate(el => el.getAttribute("data-description"), elProduct)
							let in_stock_status = 1

							let elPrice = await page.$('div.PriceUIstyles__WrapperComponentInner-sc-14j12uk-1.fFMWYd > span')
							if (elPrice != undefined && elPrice != null) {
								let price = await page.evaluate(el => el.textContent, elPrice)
								if (price != '' && price != undefined && price != null) {
									if (price.trim() == 'View Price In Cart') {
										if (await page.$('div.mapEndDate > div > span > span[data-testid="savings-end-date"]') != null && await page.$('div.mapEndDate > div > span > span[data-testid="savings-end-date"]') != undefined) {
											in_stock_status = 0
										}
										await page.click('div.atc-buy-box > div > div > button')
										await page.waitForSelector('div[data-selector="art-fl-totalPriceValue"]')
										let cartPrice = await page.evaluate(() => document.querySelector('div[data-selector="art-fl-totalPriceValue"] > div > span').textContent)
										data[idx].price = cartPrice != null && cartPrice != undefined ? parseFloat(cartPrice.trim().replace('$', '').replace(',', '')).toFixed(2) : 0
									} else if (price.includes('Striked through price')) {
										let priceF = price.replace('Striked through price', '').trim().replace('$', '').replace(',', '')
										data[idx].price = parseFloat(priceF).toFixed(2)
										data[idx].note = 'dashed price'
										in_stock_status = 0
									} else {
										let priceF = price.trim().replace('$', '').replace(',', '')
										data[idx].price =  parseFloat(priceF).toFixed(2)
									}
								} else {
									data[idx].price = 0
								}
							} else {
								data[idx].price = 0
							}

							// out of stock
							if (await page.$('span.oosStock') != undefined && await page.$('span.oosStock') != null) {
								if (await page.evaluate(el => el.textContent, await page.$('span.oosStock')) != undefined && await page.evaluate(el => el.textContent, await page.$('span.oosStock')) != '') {
									in_stock_status = 0
								}
							}
							// unavailable
							if (await page.$('div.warnMessage') != undefined && await page.$('div.warnMessage') != null) {
								let unavailable = await page.evaluate(el => el.textContent, await page.$('div.warnMessage'))
								if (unavailable.includes('THIS ITEM IS CURRENTLY UNAVAILABLE')) {
									in_stock_status = 0
								}
							}
							// unavailable online
							if (await page.$('text/This item is unavailable for purchase online') != undefined && await page.$('text/This item is unavailable for purchase online') != null) {
								let unavailableOnline = await page.evaluate(el => el.textContent, await page.$('text/This item is unavailable for purchase online'))
								if (unavailableOnline != undefined && unavailableOnline != '') {
									in_stock_status = 0
								}
							}
							

							if (data[idx].brand != '') {
								if (data[idx].brand.toUpperCase() != brand.trim().toUpperCase() && !brand.toUpperCase().includes(data[idx].brand.toUpperCase())) {
									data[idx].price = 0
								}
							}

							data[idx].brand = brand
							data[idx].product_name = product_name
							data[idx].in_stock_status = in_stock_status

							data[idx].done = true
							console.log('  -> ' + data[idx].price)
						} else {
							data[idx].note = 'No result found.'
							data[idx].done = true
						}
					} else if (checkh1 == 'Access Denied') {
						console.log(checkh1)
						data[idx].note = 'Access Denied.'

						await delay(10000)
						console.log('Stop VPN')
						await vpn.stop()
						await delay(60000)
						console.log('Start VPN')
						await vpn.start()
						await delay(180000)
						let ip = await checkIp(1)
						await delay(5000)
					} else {
						data[idx].note = 'No result found.'
						data[idx].done = true
					}

					await writeData(`${__dirname}/lowes/data-by-sku.json`, data)
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
				page = await pageRecreate(page, browser)
				await page.goto('https://www.lowes.com', { timeout: 0 }).catch(e => console.log(e))
			} finally {
				let numRecreate = 25
				if (idx == numRecreate) {
					page = await pageRecreate(page, browser)
					await page.goto('https://www.lowes.com', { timeout: 0 })
					numRecreate = numRecreate += 25
				}
				await delay(1500)
			}

			await delay(1500)
		}
	}

	await browser.close()

	if (data.findIndex(item => !item.done) !== -1 && loop <= 3) {
		loop++
		await lcpLowes(payload, datas, loop)
	}
}

let start = async () => {
    const modelWithPricetag = await fetchAxios('https://appliance-api.com/api/v2/product/bind/all?api_key=amtBMXRNelROclRWTWVNQWY3Sk5XRzFDTDJNZVBnclgxUXBmV3owWXduUmJld3J1bGhRcXN4WGFiQmRKMmNBMQ==')
    const modelOnWebsite = await fetchAxios('https://appliance-api.com/api/v2/product/all?api_key=eGkrYXpZZzZSNkNrWjNuY0RxOGZqSitRKzU0UUhLTmdLZEt2ZUxsTlVSdlQrbStnMTgwSitpTjB2UWMyc2NRWQ==&type=data-feed&filter=settings')

	let datas = await getProduct({
		modelWithPricetag: modelWithPricetag,
		modelOnWebsite: modelOnWebsite,
		batch: argv.batch - 1
	})

	console.log('total data : ' + datas.length)

	await lcpLowes({
		headless: true,
		proxy: false,
		os: 'linux',
		autoRefetch: false
	}, datas, 1)

	await saveDataSKUBased({
		name: 'Lowes Per Sku',
		data: JSON.parse(await readData(`${__dirname}/lowes/data-by-sku.json`)),
		Model: LowesModel,
		batch: argv.batch,
		StatusModel: StatusModel,
		StatusModelBatched: StatusModelBatched
	})

	await messageBot('Successfully Scrape Data', argv.batch)
}
     
start()

exports.scrapeAll = async (req, res) => {
	start()
}
