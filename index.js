const { Api, TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input'); // npm i input
const cron = require('node-cron');
require('dotenv').config();

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const stringSession = new StringSession(process.env.STRING_SESSION); // fill this later with the value from session.save()

(async () => {
	console.log('Loading interactive example...');
	const client = new TelegramClient(stringSession, apiId, apiHash, {
		connectionRetries: 5,
	});
	// console.log(client);

	await client.start({
		phoneNumber: async () => await input.text('Please enter your number: '),
		password: async () => await input.text('Please enter your password: '),
		phoneCode: async () =>
			await input.text('Please enter the code you received: '),
		onError: (err) => console.log(err),
	});
	console.log('You should now be connected.');
	// console.log(client.session.save()); // Save this string to avoid logging in again

	const groupName = 'testgrouptest3';

	const channel = await client.getEntity(groupName); // Replace with the channel's username or ID

	async function logMessage() {
		const time = new Date().toLocaleTimeString();
		const result = await client.invoke(
			new Api.messages.SendMessage({
				peer: channel,
				message: `Hello, time is: ${time}`,
			})
		);
	}

	// Schedule the cron job to run every minute
	cron.schedule('* * * * *', async () => {
		logMessage();
	});
})();
