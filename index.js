const { Api, TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const cron = require('node-cron');
require('dotenv').config();

const config = JSON.parse(process.env.CONFIG);
const bots = config.bots;
const groups = config.groups;

let clients = [];

(async () => {
	console.log('Starting script...');
	for (const bot of bots) {
		try {
			const stringSession = new StringSession(bot.STRING_SESSION);
			const client = new TelegramClient(
				stringSession,
				Number(bot.API_ID),
				bot.API_HASH,
				{
					connectionRetries: 5,
				}
			);
			await client.connect();
			clients.push(client);
			console.log(`Number: ${bot.NR} added to clients.`);
		} catch (error) {
			console.error(`Failed:`, error);
		}
	}

	// await client.start({
	// 	phoneNumber: async () => await input.text('Please enter your number: '),
	// 	password: async () => await input.text('Please enter your password: '),
	// 	phoneCode: async () =>
	// 		await input.text('Please enter the code you received: '),
	// 	onError: (err) => console.log(err),
	// });

	// console.log(client.session.save()); // Save this string to avoid logging in again

	//Get messages from repo
	let messages = [];
	let activeMessage = null;
	async function fetchMessages() {
		if (clients.length) {
			const defaultClient = clients[0];
			await defaultClient.connect();
			const msgRepo = await defaultClient.getEntity('myrepository9');
			// Fetch the last 10 messages
			messages = await defaultClient.getMessages(msgRepo, { limit: 10 });
			messages = messages.filter((message) => message.media);
		} else {
			console.log('No clients connected.');
			return;
		}
	}
	fetchMessages();

	function setActiveMessage() {
		// If there's no active message, start with the first one
		if (!activeMessage) {
			activeMessage = messages[0];
			return activeMessage;
		}

		// Find the index of the current active message
		const currentIndex = messages.findIndex(
			(message) => message === activeMessage
		);

		// Determine the next message index cyclically
		const nextIndex = (currentIndex + 1) % messages.length;

		// Update the active message
		activeMessage = messages[nextIndex];
		return activeMessage;
	}

	async function logMessages() {
		for (const group of groups) {
			for (const client of clients) {
				try {
					setActiveMessage();
					await client.connect();
					await client.sendFile(group, {
						file: activeMessage.media,
						caption: activeMessage.message || '', // Include the caption if it exists
					});
					console.log(`Message sent to ${group}`);
				} catch (error) {
					console.error(
						`Failed: client ${client.apiId} sending to ${group}`,
						error
					);
					if (error.code == 400) {
						fetchMessages();
					}
				}
			}
		}
	}

	// Schedule the cron job
	cron.schedule(`* * * * *`, async () => {
		logMessages();
	});
})();
