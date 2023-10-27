const fs = require('fs')
const puppeteer = require('puppeteer-extra')
const stealthPlugin = require('puppeteer-extra-plugin-stealth')
const moment = require('moment')
const axios = require('axios')
const dbConfig = require('./config')
const model = require('./model')
const path = require('path')
const { Sequelize } = require('sequelize')
const { proxies } = require('./constants')
const { default: Axios } = require('axios')
require('dotenv').config();

const setupPuppeteer = async options => {
	const {
		rootUrl,
		headless,
		defaultViewport,
		args,
		executablePath,
		excludedResourceTypes,
		permissions
	} = options

	puppeteer.use(stealthPlugin())

	const browser = await puppeteer.launch({
		headless: headless || false,
		defaultViewport: defaultViewport || null,
		ignoreDefaultArgs: ['--enable-automation'],
		args,
		executablePath
	})
	const page = await browser.newPage()
	const context = browser.defaultBrowserContext()

	if (excludedResourceTypes) {
		await page.setRequestInterception(true)

		page.on('request', interceptedRequest => {
			if (excludedResourceTypes.includes(interceptedRequest.resourceType()))
				interceptedRequest.abort()
			else interceptedRequest.continue()
		})
	}

	if (permissions) await context.overridePermissions(rootUrl, permissions)

	return {
		browser,
		page
	}
}

const setupSequalize = (
	payload = {
		database: 'dataslym_scraping_team',
		username: 'data_team',
		password: '==UBly{S7;03l_{',
		host: '170.249.211.10',
		timezone: '-06:00',
		dialect: 'mysql',
		pool: undefined
	}
) => {
	const { database, username, password, host, timezone, dialect, pool } = payload

	return new Sequelize(database, username, password, {
		host,
		dialect,
		operatorsAliases: 0,
		logging: false,
		timezone, // for writing to database
		pool: pool ? pool : dbConfig.pool,
		define: {
			timestamps: false,
			freezeTableName: true
		}
	})
}

const getProxy = () => {
	return proxies[Math.floor(Math.random() * proxies.length)]
}

const writeData = async (path, data) => {
	try {
		await fs.writeFileSync(path, JSON.stringify(data), 'utf8')
	} catch (err) {
		throw err
	}
}

const readData = async path => {
	try {
		return await fs.readFileSync(path, 'utf8')
	} catch (err) {
		throw err
	}
}

const deleteData = async path => {
	try {
		return await fs.unlinkSync(path)
	} catch (err) {
		throw err
	}
}

const delay = time => {
	return new Promise(resolve => {
		return setTimeout(function () {
			resolve()
		}, time)
	})
}

const saveScrapeError = async err => {
	return new Promise(async (resolve, reject) => {
		await model.saveError({
			file: path.basename(__filename),
			message: err.message !== undefined ? err.message : err.error,
			error_detail: err
		})
		resolve(true)
	})
}

let saveScrape = payload => {
	const { data, Model } = payload

	return new Promise(async (resolve, reject) => {
		await Model.bulkCreate(data)
			.then(() => {
				resolve('success')
			})
			.catch(err => {
				console.log(err)
				reject('error')
			})

		reject('error')
	}).catch(async err => {
		await saveScrapeError(err)
		console.log(err)
		return Promise.reject('error')
	})
}

const saveScrapeData = async payload => {
	const { name, data, Model, StatusModel } = payload

	console.log(`---Start Saving ${name}---`)

	for (const item of data) {
		if (item.data !== undefined) {
			console.log(`Saving ${name}...`)

			await saveScrape({ data: item.data, Model })

			await delay(3000)
		}
	}
	await updateScrapeStatus({
		name: name,
		status: 'Success',
		Model: StatusModel,
	})


	console.log(`---Saving Completed ${name}---`)
}

const saveDataSKUBased = async payload => {
	const { name, data, Model, batch, StatusModel, StatusModelBatched } = payload

	console.log(`---Start Saving ${name}---`)
	let new_data = []
	data.map((d) => {
		if (d.price != undefined && (d.note == undefined || d.note == 'dashed price')) {
			new_data.push({
				sku: d.sku.replace(/[^a-zA-Z0-9]/g, ""),
				brand: d.brand,
				product_name: d.product_name,
				price: d.price,
				discount_price: d.price,
				in_stock_status: d.in_stock_status != undefined && d.in_stock_status != null ? d.in_stock_status : 0,
				created_at: moment.tz(new Date(), 'America/Chicago').format('YYYY-MM-DD HH:mm:ss')
			})
		}
	})

	await saveScrape({ data: new_data, Model })
	await updateScrapeStatus({
		name: name,
		status: 'Success',
		batch: batch,
		Model: StatusModel,
		ModelBatched: StatusModelBatched,
	})


	console.log(`---Saving Completed ${name}---`)
}

const updateSuccessStatus = async payload => {
	const { scraping_id, Model, ModelBatched } = payload

	try {
		await ModelBatched.findAll({
			where: {
				scraping_id,
				status: 'On Progress'
			}
		}).then(async function (btc) {
			if (btc.length == 0) {
				return await Model.update({
					status: 'Success',
					updated_at: moment.tz(new Date(), 'America/Chicago').format('YYYY-MM-DD HH:mm:ss')
				}, {
					where: {
						id: scraping_id
					}
				})
			}

			return true;
		})
	} catch (err) {
		console.log(err)
	}
}

const updateScrapeStatus = async payload => {
	const { name, status, batch, Model, ModelBatched } = payload

	try {
		if (batch) {
			await Model.findOne({
				where: {
					name
				}
			}).then(async function (obj) {
				if (obj) {
					if (status == 'On Progress')
						await obj.update({ status, updated_at: moment.tz(new Date(), 'America/Chicago').format('YYYY-MM-DD HH:mm:ss') })

					await ModelBatched.findOne({
						where: {
							scraping_id: obj.id,
							batch: batch
						}
					}).then(async function (st) {
						if (st) {
							await st.update({
								status,
								updated_at: moment.tz(new Date(), 'America/Chicago').format('YYYY-MM-DD HH:mm:ss')
							})
							await updateSuccessStatus({ scraping_id: obj.id, Model, ModelBatched })
							return obj;
						}

						await ModelBatched.create({
							scraping_id: obj.id,
							batch,
							status,
							created_at: moment.tz(new Date(), 'America/Chicago').format('YYYY-MM-DD HH:mm:ss'),
							updated_at: moment.tz(new Date(), 'America/Chicago').format('YYYY-MM-DD HH:mm:ss')
						})
						await updateSuccessStatus({ scraping_id: obj.id, Model, ModelBatched })
					})
					return obj;
				}

				let scraping = await Model.create({
					status,
					name,
					brand_slug: name,
					created_at: moment.tz(new Date(), 'America/Chicago').format('YYYY-MM-DD HH:mm:ss'),
					updated_at: moment.tz(new Date(), 'America/Chicago').format('YYYY-MM-DD HH:mm:ss')
				}).then((data) => { return data })
				await ModelBatched.create({
					scraping_id: scraping.id,
					batch,
					status,
					created_at: moment.tz(new Date(), 'America/Chicago').format('YYYY-MM-DD HH:mm:ss'),
					updated_at: moment.tz(new Date(), 'America/Chicago').format('YYYY-MM-DD HH:mm:ss')
				})
				await updateSuccessStatus({ scraping_id: scraping.id, Model, ModelBatched })
				return scraping;
			})
		}
	} catch (err) {
		console.log(err)
	}
}

const pageRecreate = async (page, browser) => {
	await page.waitForTimeout(1000)
	await page.close()
	await page.waitForTimeout(1000)

	return await browser.newPage()
}

const fetchAxios = async url => {
	try {
		const { data } = await axios.get(url);
		if (data) {
			console.log('request success to : ' + url)
			return data;
		}
		console.log('request failed to : ' + url)
		return [''];
	} catch (err) {
		console.log('request failed to : ' + url)
		console.log('ERROR : ' + err.message)
		return [''];
	}
}

const checkIp = async loop => {
	return new Promise(async (resolve, reject) => {
		let current_ip = ''
		try {
			let ip = await fetchAxios('https://ipinfo.io/ip')
			console.log(`IP : ${ip}`)

			if (ip.includes("170.249.211.82")) {
				if (loop <= 5) {
					await delay(60000)
					loop++
					current_ip = await checkIp(loop)
				} else {
					resolve(false)
				}
			} else {
				current_ip = ip
			}
		} catch (err) {
			console.log(err)
		}

		resolve(current_ip);
	})
}

const message = async (title, widgets, threadKey) => {
	const cardMessage = {
		cards: [
			{
				header: {
					title: title,
				},
				sections: [
					{
						widgets: widgets
					},
				],
			},
		],
		thread: {
			name: threadKey,
		},
	};
	return cardMessage
}

const webhook = async (cardMessage, thread = false, threadKey = '') => {
	if (thread) {
		var webhookUrl = 'https://chat.googleapis.com/v1/spaces/AAAAvn-fIfA/messages?threadKey=' + threadKey + '&messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD&key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=OTVxNSaIicNNq6rLpCnngdu8Yxa4DojUHiXGq4fqcs4';
	} else {
		var webhookUrl = 'https://chat.googleapis.com/v1/spaces/AAAAvn-fIfA/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=OTVxNSaIicNNq6rLpCnngdu8Yxa4DojUHiXGq4fqcs4';
	}
	const res = axios.post(webhookUrl, cardMessage)
		.then(response => {
			console.log('Card message sent');
			// console.log(response)
			return response
		})
		.catch(error => {
			console.error('Error sending card message:', error);
		});

	return res
}

const messageBot = async (msg, batch) => {

	let getKey = await fetchAxios('http://170.249.211.82:12388/api/lcp/bot')
	let data = getKey[0].data.thread
	let thread = data

	let messagesThread = await message(`Lowes Batch ${batch}`, [
		{
			textParagraph: {
				text: msg,
			},
		}
	], thread)

	await webhook(messagesThread, true, thread)


}


module.exports = {
	setupPuppeteer,
	setupSequalize,
	getProxy,
	writeData,
	readData,
	deleteData,
	delay,
	saveScrapeError,
	saveScrape,
	saveScrapeData,
	updateScrapeStatus,
	pageRecreate,
	saveDataSKUBased,
	fetchAxios,
	checkIp,
	messageBot
}
