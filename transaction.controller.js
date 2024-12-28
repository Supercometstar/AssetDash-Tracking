const axios = require('axios')
const fs = require('fs')
const path = require('path')

const { Transaction } = require('@models')
const { getHeader, log } = require('@utils')


const chatId = [];



const getTransaction = async () => {

	let finalCheck

	try {
		finalCheck = fs.readFileSync(path.join(__dirname, '../logs/final_check.log'), encoding='utf-8')
		if (finalCheck === '') finalCheck = undefined
	} catch (e) {
		fs.writeFileSync(path.join(__dirname, '../logs/final_check.log'), '', encoding='utf-8')
	}
	if (finalCheck) {
		let response 
		for (let i=0; i<Number(process.env.RETRIES); i++) {
			try {
				response = await axios.get(`https://swap-api.assetdash.com/api/api_v5/whalewatch/transactions/list?page=1&limit=100&after_timestamp=${encodeURIComponent(finalCheck)}`, { headers: getHeader(), timeout: 5000 })
				break
			} catch (e) {
				log('Retry send request')
			}
		}
		if (response) {
			response.data.transactions = response.data.transactions.filter((item) => {
				return item.timestamp !== finalCheck
			})
			await addTransaction(response.data.transactions)
			if (response.data.transactions.length !== 0) {
				finalCheck = response.data.transactions[0].timestamp
				fs.writeFileSync(path.join(__dirname, '../logs/final_check.log'), response.data.transactions[0].timestamp)
			}
			await checkTransaction(finalCheck, response.data.transactions)
		}
	}else {
		let response
		for (let i=0; i<Number(process.env.RETRIES); i++) {
			try {
				response = await axios.get(`https://swap-api.assetdash.com/api/api_v5/whalewatch/transactions/list?page=1&limit=100`, { headers: getHeader(), timeout: 5000 })
				break
			} catch (e) {
				log('Retry send request')
			}
		}
		if (response) {
			await addTransaction(response.data.transactions)
			finalCheck = response.data.transactions[0].timestamp
			fs.writeFileSync(path.join(__dirname, '../logs/final_check.log'), response.data.transactions[0].timestamp)
		}
	}
	setTimeout(getTransaction, 1000)

}

const addTransaction = async (data) => {
	if (data.length === 0) {
		log(`No data updated`)
	}else {
		log(`${data.length} data added to MongoDB.`)
	}
	try {
		await Transaction.insertMany(data)
	} catch (e) {
		console.log(e)
	}
}

const checkTransaction = async (finalCheck, data) => {
	if (data.length === 0) return 

	data = data.map((item) => item.swap_token_id)
	console.log(data)
	const now = new Date(finalCheck)
	const twoMinutesAgo = new Date(now - 2*60*1000)
	
	const transactionIds = await Transaction.aggregate([
		{
			$match: {
				timestamp: { $gte: twoMinutesAgo, $lte: now },
				swap_token_id: { $in: data }
			}
		},
		{
			$group: {
				_id: '$swap_token_id',
				count: { $sum: 1 }
			}
		},
		{
			$match: {
				count: { $gt: 1 }
			}
		}
	])

	const idList = transactionIds.map((item) => item._id)

	const transactions = await Transaction.aggregate([
		{
			$match: {
				_id: { $in: idList }
			}
		}
	])

	console.log(transactions)


	for(let i = 0; i < chatId.length; i++)
		global.telegramBot.sendMessage(chatId[i], transactions);

	return transactions

}


module.exports = {
	getTransaction,
	addTransaction
}