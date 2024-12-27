const axios = require('axios')
const fs = require('fs')
const path = require('path')

const { Transaction } = require('@models')
const { getHeader, log } = require('@utils')

const getTransaction = async () => {

	let finalCheck

	try {
		finalCheck = fs.readFileSync(path.join(__dirname, '../logs/final_check.log'), encoding='utf-8')
		if (finalCheck === '') finalCheck = undefined
	} catch (e) {
		fs.writeFileSync(path.join(__dirname, '../logs/final_check.log'), '', encoding='utf-8')
	}
	log(`Start scrapping!`)
	if (finalCheck) {
		const response = await axios.get(`https://swap-api.assetdash.com/api/api_v5/whalewatch/transactions/list?page=1&limit=100&after_timestamp=${encodeURIComponent(finalCheck)}`, { headers: getHeader() })
		response.data.transactions.pop()
		await addTransaction(response.data.transactions)
		if (response.data.transactions.length !== 0) {
			finalCheck = response.data.transactions[0].timestamp
			fs.writeFileSync(path.join(__dirname, '../logs/final_check.log'), response.data.transactions[0].timestamp)
		}
	}else {
		console.log()
		const response = await axios.get(`https://swap-api.assetdash.com/api/api_v5/whalewatch/transactions/list?page=1&limit=100`, { headers: getHeader() })
		await addTransaction(response.data.transactions)
		finalCheck = response.data.transactions[0].timestamp
		fs.writeFileSync(path.join(__dirname, '../logs/final_check.log'), response.data.transactions[0].timestamp)
	}
	setTimeout(getTransaction, 1000)

}

const addTransaction = async (data) => {
	log(`${data.length} data added to MongoDB.`)
	// data = data.map((item) => {
	// 	return {
	// 		timestamp: item.timestamp,
	// 		whale: item.swap_whalewatch_list.id,
	// 		token: item.swap_token_id,
	// 		marketCap: item.token_market_cap,
	// 	}
	// })
	console.log(data[0])
	try {
		await Transaction.insertMany(data)
	} catch (e) {
		console.log(e)
	}
}

module.exports = {
	getTransaction,
	addTransaction
}