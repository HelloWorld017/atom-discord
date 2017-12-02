const {ipcMain} = require('electron');
const path = require('path');
const snekfetch = require("snekfetch");
let Client = undefined;

const DISCORD_ID = '380510159094546443';

if (!String.prototype.padStart) {
	String.prototype.padStart = function padStart(targetLength,padString) {
		targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
		padString = String(padString || ' ');
		if (this.length > targetLength) {
			return String(this);
		}
		else {
			targetLength = targetLength-this.length;
			if (targetLength > padString.length) {
				padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
			}
			return padString.slice(0,targetLength) + String(this);
		}
	};
}

// Setup configuration object
const config = {
	translations: {},
	privacy: {},
	behaviour: {},
	getTranslation(key, args = {}) {
		let tr = config.translations[key];
		if(!tr) return "UNDEFINED_TRANSLATION";

		Object.keys(args).forEach((i) => tr = tr.replace(new RegExp(`%${i}%`, 'g'), args[i]));

		return tr;
	},
	icon: new Map()
};

const normalize = (object) => {
	Object.keys(object).forEach((k) => {
		if(object[k] === null){
			delete object[k];
		}
	});

	return object;
};

class DiscordSender {
	constructor() {
		this.projectName = null;
		this.fileName = null;
		this.largeImage = null;
		this.startTimestamp = new Date().getTime() / 1000;

		this.onlineRenderers = {};
		this.rpc = null;
		this.destroied = false;
	}

	setOnline(id) {
		if(this.onlineRenderers[id]) return;

		let sendAfter = !this.isRendererOnline;
		console.log(`Editor ${id} became online.`);

		this.onlineRenderers[id] = true;

		if(sendAfter){
			console.log(`New editor confirmed, sending activities...`);
			this.sendActivity();
		}
	}

	setOffline(id) {
		if(!this.onlineRenderers[id]) return;

		console.log(`Editor ${id} became offline.`);

		this.onlineRenderers[id] = false;

		if(!this.isRendererOnline) {
			console.log(`No editor remained, deleting activities...`);
			this.deleteActivity();

			/*setTimeout(() => {
				// After grace period(5s), if there are no editors, destroy RPC.
				if(!this.isRendererOnline) this.destroyRpc();
			}, 5000);*/

			// Just immediately destroying because the speed of closing atom is faster than 5s.
			this.destroyRpc();
		}
	}

	setupRpc() {
		if(this.rpc) return;

		return new Promise((resolve, reject) => {
			if(typeof Client === 'undefined') return reject("No client available!");

			const rpc = new Client({ transport: 'ipc' });
			rpc.on('ready', () => {
				this.rpc = rpc;
				this.destroied = false;
				resolve();
			});
			rpc.login(DISCORD_ID).catch(reject);
		});
	}

	async destroyRpc() {
		if(this.destroied) return;

		console.log("Destroying RPC Client...");
		this.destroied = true;

		const _rpc = this.rpc;
		this.rpc = null;

		await _rpc.destroy();
		console.log("Done destroying RPC Client. It is now safe to turn off the computer.")
	}

	sendActivity() {
		if(!this.rpc) return;
		if(!this.isRendererOnline) return;

		// Set packet variables
		let state = this.projectName ? config.getTranslation('working-project', {
			projectName: this.projectName
		}) : config.getTranslation('working-no-project');

		let details = this.fileName ? config.getTranslation('editing-file', {
			fileName: this.fileName
		}) : config.getTranslation('editing-idle');

		let largeImageKey = this.largeImage ? this.largeImage.icon : null;
		let largeImageText = this.largeImage ? this.largeImage.text : null;

		let smallImageKey = config.behaviour.alternativeIcon;
		let smallImageText = config.getTranslation('atom-description');

		let startTimestamp = this.startTimestamp;

		// Remove privacy-related things
		if(!config.privacy.sendProject) state = config.getTranslation('working-no-project');
		if(!config.privacy.sendFilename) details = config.getTranslation('type-unknown');
		if(!config.privacy.sendFileType) largeImageKey = 'text', largeImageText = config.getTranslation('type-unknown');
		if(!config.privacy.sendElapsed) startTimestamp = null;

		// Respect behaviour setting
		if(config.behaviour.preferType) {
			if(this.largeImage.text === config.getTranslation('developer-idle'))
				details = config.getTranslation('editing-idle');
			else
				details = this.largeImage.text;
		}
		if(config.behaviour.showFilenameOnLargeImage) {
			largeImageText = this.fileName ? config.getTranslation('editing-file', {
				fileName: this.fileName
			}) : config.getTranslation('developer-idle');
		}
		if(config.behaviour.useRestIcon && !this.fileName) largeImageKey = 'rest';
		if(!config.behaviour.sendSmallImage) smallImageKey = null, smallImageText = null;
		if(!config.behaviour.sendLargeImage) largeImageKey = null, largeImageText = null;

		let packet = normalize({
			state,
			details,

			largeImageKey,
			largeImageText,

			smallImageKey,
			smallImageText,

			startTimestamp
		});

		this.rpc.setActivity(packet);
	}

	updateActivity(projectName, fileName) {
		this.projectName = projectName;
		this.fileName = fileName;

		if(this.fileName && config.icon) {
			let found = false;

			config.icon.forEach((value, test) => {
				if(found) return;
				let result = false;

				if(typeof test === 'string') result = this.fileName.endsWith(test);
				else if(test.test) result = test.test(this.fileName);

				if(result) {
					found = true;
					this.largeImage = value;
				}
			});

			if(!found) this.largeImage = {
				icon: 'text',
				text: path.extname(this.fileName)
			};

			this.largeImage = {
				icon: this.largeImage.icon,
				text: config.getTranslation('type-description', {
					type: this.largeImage.text
				})
			};

		} else {
			this.largeImage = {
				icon: 'text',
				text: config.getTranslation('developer-idle')
			};
		}
	}

	deleteActivity() {
		if(!this.rpc) return;

		this.rpc.setActivity({});
		console.log("Deleting remain activities...");
	}

	async loop() {
		try {
			if(this.destroied) await this.setupRpc(Client)
		} catch(e) {}

		if(this.isRendererOnline) this.sendActivity();

		setTimeout(this.loopFunction, config.behaviour.updateTick);
	}

	get loopFunction() {
		return this.loop.bind(this);
	}

	get isRendererOnline() {
		return Object.keys(this.onlineRenderers).some((v) => this.onlineRenderers[v]);
	}
}

const sender = new DiscordSender();

ipcMain.on('atom-discord.discord-setup', (event, arg) => {
	if(sender.rpc) return;

	const REGEX_REGEX = /^\/(.*)\/([mgiy]+)$/;

	config.icon = new Map(Object.keys(arg.matchData).map((key) => {
		let match = key.match(REGEX_REGEX);
		if(!match) return [key, arg.matchData[key]];

		return [new RegExp(match[1], match[2]), arg.matchData[key]];
	}));

	Client = require(arg.rpcPath).Client;

	(async () => {
		await sender.setupRpc();
		await sender.loop();
		console.log("Set up discord RPC.");
	})();
});

ipcMain.on('atom-discord.config-update', (event, {i18n, privacy: _privacy, behaviour: _behaviour}) => {
	config.translations = i18n;
	config.behaviour = _behaviour;
	config.privacy = _privacy;
});

ipcMain.on('atom-discord.data-update', (event, {projectName, currEditor: fileName}) => {
	sender.updateActivity(projectName, fileName);
});

ipcMain.on('atom-discord.online', (event, {id}) => {
	sender.setOnline(id);
});

ipcMain.on('atom-discord.offline', (event, {id}) => {
	sender.setOffline(id);
});
