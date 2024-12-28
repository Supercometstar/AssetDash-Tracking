const TelegramBot = require('node-telegram-bot-api');

module.exports = {
	listen: () => {

		const chatId = []

		const token = process.env.TELEGRAM_BOT_TOKEN; // Replace with your own bot token
		const bot = new TelegramBot(token, { polling: true });

		bot.on('message', (msg) => {
		    const chatidk = msg.chat.id;

			const messageText = msg.text;
		  
		    // Process the incoming message here
		    
		    if (messageText === '/start') {
		        bot.sendMessage(chatidk, 'Welcome to the bot!');

				if (!chatId.includes(chatidk))  
					chatId.push(chatidk);
				
		    }

		});

		global.chatId = chatId
		global.telegramBot = bot

	}
}