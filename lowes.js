'use strict'

const fs = require('fs')
const cron = require('node-cron')
const { parseString } = require('xml2js')
const { DataTypes } = require('sequelize')
const {
	setupPuppeteer,
	setupSequalize,
	getProxy,
	writeData,
	readData,
	deleteData,
	saveScrapeData,
	updateScrapeStatus
} = require('./helpers')
const args = require('minimist')(process.argv.slice(2))
const delay = (time) => {
    return new Promise((resolve) => {
      return setTimeout(function () {
        resolve()
      }, time)
    })
}

const vpn = require('./vpn/vpn')

const Sequelize = setupSequalize()
const LowesModel = Sequelize.define('v4_lowes_products', {
	sku: DataTypes.STRING,
	brand: DataTypes.STRING,
	product_name: DataTypes.STRING,
	price: DataTypes.DOUBLE,
	discount_price: DataTypes.DOUBLE
})
const StatusModel = Sequelize.define('scrape_product_progress', {
	brand_slug: DataTypes.STRING,
	name: DataTypes.STRING,
	status: DataTypes.STRING,
	created_at: DataTypes.STRING,
	updated_at: DataTypes.STRING
})
const reformatLowesData = data => {
	return data.itemList.map(item => {
		let retail = 0
		let sell = 0

		if (item.location.price) {
			if (item.location.price.displayPriceType === 'was') {
				sell = !item.location.price.sellingPrice.dollar
					? item.location.price.sellingPrice
					: item.location.price.sellingPrice.dollar
				retail = !item.location.price.wasPrice.dollar
					? item.location.price.wasPrice
					: item.location.price.wasPrice.dollar
			} else if (
				item.location.price.displayPriceType === 'mapWas' ||
				item.location.price.displayPriceType === 'map'
			) {
				sell = item.location.price.mapPrice
				retail = item.location.price.mapPrice
			} else if (item.location.price.displayPriceType === 'selling') {
				sell = item.location.price.sellingPrice
				retail = item.location.price.sellingPrice
			} else {
				sell = item.location.price.sellingPrice
				retail = !item.location.price.retailPrice
					? item.location.price.sellingPrice
					: item.location.price.retailPrice
			}
			if (!retail && sell) retail = sell
			if (retail && !sell) sell = retail
		}

		return {
			brand: item.product.brand,
			product_name: item.product.description,
			sku: item.product.modelId,
			price: sell
		}
	})
}
const setLowesStore = async page => {
	await page.goto(`https://www.lowes.com/store`)
	await page.waitForSelector('title')
	await page.click('.TextInputWrapper-b3qmsm-0 input')
	await page.waitForTimeout(200)
	await page.type('.TextInputWrapper-b3qmsm-0 input', 'ballwin', {
		delay: 100
	})
	await page.waitForTimeout(200)
	await page.keyboard.press('Enter')
	await page.waitForSelector('button[data-storenumber="1503"]')
	await page.waitForTimeout(200)
	await page.click('button[data-storenumber="1503"]')
	await page.waitForNavigation({ waituntil: 'domcontentloaded' })
}

const lcpLowes = async (payload, loop = 1) => {
	const { headless, proxy, os, autoRefetch } = payload
	const args = [
		'--no-sandbox',
		'--disable-setuid-sandbox',
		'--headless',
		'--disable-dev-shm-usage',
		'--disable-accelerated-2d-canvas',
		'--no-first-run',
		'--no-zygote',
		'--single-process', // <- this one doesn't works in Windows
		'--disable-gpu'
	]

	if (proxy) args.push('--proxy-server=3.227.216.162:31112')

	let { browser, page } = await setupPuppeteer({
		headless,
		args,
		rootUrl: 'https://www.lowes.com/',
		// excludedResourceTypes: ['font', 'media', 'other', 'manifest'],
		permissions: [],
		ignoreDefaultArgs: ['--enable-automation'],
		defaultViewport: null,
		executablePath:
			os === 'mac'
				? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
				: os === 'linux'
				? '/root/.cache/puppeteer/chrome/linux-1069273/chrome-linux/chrome'
				: 'C:/Users/Human/.cache/puppeteer/chrome/win64-1069273/chrome-win/chrome.exe'
	})

	if (await fs.existsSync(`${__dirname}/lowes/data.json`) && loop === 1)
		await deleteData(`${__dirname}/lowes/data.json`)

	await page.goto(`https://www.lowes.com/sitemap/navigation0.xml`)

	const xml = await page.$eval('urlset', body => body.outerHTML)

	parseString(xml, async (err, result) => {
		await writeData(
			`${__dirname}/lowes/data.json`,
			result.urlset.url
				.filter(url => url.loc[0].match(/https:\/\/www\.lowes\.com\/pl\/.*(Appliances|Heating-cooling).*\/\d+/gi))
				.map(url => ({
					url: url.loc[0]
				}))
		)
	})
	await setLowesStore(page)
	await updateScrapeStatus({
		name: 'Lowes',
		status: 'On Progress',
		Model: StatusModel
	})

	const data = JSON.parse(await readData(`${__dirname}/lowes/data.json`, 'utf8'))

	for (const [index, item] of data.entries()) {
		if (!item.done) {
			try {
				console.log(item.url)

				if (proxy)
					await page.authenticate({
						username: 'gzhsmnmc',
						password: '8av87EqFR4gmFbwA_country-UnitedStates'
					})

				await page.goto(
					`${item.url}${item.currentPage ? `?offset=${24 * (item.currentPage - 1)}` : ''}`
				)
				await page.$eval('[data-selector="splp-prd-lst-splc"] + div', el => {
					el.scrollIntoView()
				})
				await page.waitForTimeout(5000)

				if (!item.page) {
					data[index] = {
						data: reformatLowesData(
							await page.$$eval('script[charSet="UTF-8"]', async options => {
								let data = undefined

								options.forEach(script => {
									if (script.innerHTML.match(/window\['__PRELOADED_STATE__'\] =.*/gi))
										data = JSON.parse(
											script.innerHTML.replace(/(window\['__PRELOADED_STATE__'\] = )/gi, '')
										)
								})

								return data
							})
						),
						page: await page.$eval('ul[data-selector="splp-pag-lst"]', el => {
							if (el) {
								const elLastPage = document.querySelector(
									'ul[data-selector="splp-pag-lst"] .last_page'
								)

								if (elLastPage) return parseInt(elLastPage.textContent)

								return document.querySelectorAll('ul[data-selector="splp-pag-lst"] li').length - 2
							}

							return 1
						})
					}

					await writeData(`${__dirname}/lowes/data.json`, data)
				}

				console.log(`Total Page: ${data[index].page}`)
				console.log(`Page: ${item.currentPage ? item.currentPage : 1}`)

				if (data[index].page > 1) {
					for (
						let indexPage = item.currentPage ? item.currentPage + 1 : 2;
						indexPage <= parseInt(data[index].page);
						indexPage++
					) {
						console.log(`Page: ${indexPage}`)

						await page.click('ul[data-selector="splp-pag-lst"] [aria-label="arrow right"]')

						let response = await page.waitForResponse(response =>
							response.url().match(/https:\/\/www.lowes.com\/pl\/.+\/\d*\/products.*/gi)
						)
						response = await response.json()
						response = reformatLowesData(response)

						data[index].data = data[index].data.concat(response)
						data[index].currentPage = indexPage

						await writeData(`${__dirname}/lowes/data.json`, data)
						await page.waitForTimeout(5000)
					}
				}

				data[index].done = true

				console.log('-----Complete-----')
			} catch (e) {
				console.log(e)
			}
		}
	}

	await browser.close()

	if (autoRefetch && data.findIndex(item => !item.done) !== -1 && loop >= 5) {
		loop++

		await updateScrapeStatus({
			name: 'Lowes',
			status: 'Error, Retrying..',
			Model: StatusModel
		})
		await lcpLowes(payload, loop)
	}
}

let all = async () => {
	await lcpLowes({
		headless: false,
		proxy: false,
		os: 'linux',
		autoRefetch: false
	})
	await saveScrapeData({
		name: 'Lowes',
		data: JSON.parse(await readData(`${__dirname}/lowes/data.json`)),
		Model: LowesModel,
		StatusModel: StatusModel
	})
}

exports.scrapeAll = async (req, res) => {
	all()

	res.json('success')
}

// ;(async () => {
// 	console.log('Start VPN')
// 	await vpn.start()
// 	await delay(10000)
// 	console.log('Running a LCP Lowes Jobs - America/Chicago')
// 	await lcpLowes({
// 		headless: false,
// 		proxy: false,
// 		os: 'linux',
// 		autoRefetch: false
// 	})
// 	await saveScrapeData({
// 		name: 'Lowes',
// 		data: JSON.parse(await readData(`${__dirname}/lowes/data.json`)),
// 		Model: LowesModel,
// 		StatusModel: StatusModel
// 	})
// 	await delay(300000)
// 	lowesBySku.scrapeAll()
// 	console.log(`---Cron Job Completed Lowes---`)
// 	await delay(10000)
// 	console.log('Stop VPN')
// 	await vpn.stop()
// })()

// cron.schedule(
// 	'0 3,15 * * *',
// 	async () => {
// 		console.log('Start VPN')
// 		await vpn.start()
// 		await delay(10000)
// 		console.log('Running a LCP Lowes Jobs - America/Chicago')
// 		await lcpLowes({
// 			headless: false,
// 			proxy: false,
// 			os: 'linux',
// 			autoRefetch: false
// 		})
// 		await saveScrapeData({
// 			name: 'Lowes',
// 			data: JSON.parse(await readData(`${__dirname}/lowes/data.json`)),
// 			Model: LowesModel,
// 			StatusModel: StatusModel
// 		})
// 		console.log(`---Cron Job Completed Lowes---`)
// 		await delay(10000)
// 		console.log('Stop VPN')
// 		await vpn.stop()
// 	},
// 	{
// 		scheduled: true,
// 		timezone: 'America/Chicago'
// 	}
// )
