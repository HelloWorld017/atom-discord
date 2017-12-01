const {ipcMain} = require('electron');
const path = require('path');
const snekfetch = require("snekfetch");

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
	icon: Map()
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
	}

	setOnline(id) {
		let sendAfter = !this.isRendererOnline;
		this.onlineRenderers[id] = true;

		if(sendAfter) this.sendActivity();
	}

	setOffline(id) {
		this.onlineRenderers[id] = false;

		if(!this.isRendererOnline) {
			this.deleteActivity();
		}
	}

	setupRpc(Client) {
		rpc = Client({ transport: 'ipc' });
		rpc.login(arg.discordId).catch(console.error);
	}

	sendActivity() {
		// Set packet variables
		let state = this.projectName ? config.getTranslation('working-project', {
			projectName: this.projectName
		}) : config.getTranslation('working-no-project');

		let details = this.fileName ? config.getTranslation('editing-file', {
			fileName: this.fileName
		}) : config.getTranslation('editing-idle');

		let largeImageKey = this.largeImage ? this.largeImage.icon : null;
		let largeImageText = this.largeImage ? this.largeImage.text : null;

		let smallImageKey = 'atom';
		let smallImageText = config.getTranslation('atom-description');

		let startTimestamp = this.startTimestamp;

		// Remove privacy-related things
		if(!config.privacy.sendProject) state = config.getTranslation('working-no-project')
		if(!config.privacy.sendFilename) details = config.getTranslation('editing-idle')
		if(!config.privacy.sendFileType) largeImageKey = null, largeImageText = null;
		if(!config.privacy.sendElapsed) startTimestamp = null;

		// Remove small icon
		if(!config.behaviour.smallIconToggle) smallImageKey = null, smallImageText = null;

		let packet = normalize({
			state,
			details,

			largeImageKey,
			largeImageText,

			smallImageKey,
			smallImageText,

			startTimestamp
		});

		rpc.setActivity(packet);
	}

	updateActivity(projectName, fileName) {
		this.projectName = projectName;
		this.fileName = fileName;

		if(this.fileName && icon.matchKeys) {
			let found = false;

			config.icon.forEach((value, test) => {
				if(found) return;
				result = false;

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
				text: getTranslation('type-description', {
					type: this.largeImage.text
				})
			};

		} else {
			this.largeImage = {
				icon: 'text',
				text: getTranslation('developer-idle')
			};
		}
	}

	deleteActivity() {
		rpc.setActivity({
			details: ''
		});
	}

	loop() {
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
	const REGEX_REGEX = /^\/(.*)\/([mgiy]+)$/;

	config.icon = Map(Object.keys(icon.matchData).map((key) => {
		let match = key.match(REGEX_REGEX);
		if(!match) return [key, icon.matchData[key]];

		return [new RegExp(match[1], match[2]), icon.matchData[key]];
	}));

	const {Client} = require(arg.rpcPath);
	sender.setupRpc(Client);
	sender.loop();

	console.log("Set up discord RPC.");
});

ipcMain.on('atom-discord.config-update', (event, {i18n, privacy: _privacy, behaviour: _behaviour}) => {
	config.translations = i18n;
	config.behaviour = _behaviour;
	config.privacy = _privacy;
});

ipcMain.on('atom-discord.data-update', (event, {projectName, fileName: currEditor}) => {
	sender.updateActivity(projectName, fileName);
});

ipcMain.on('atom-discord.online', (event, {id}) => {
	sender.setOnline(id);
});

ipcMain.on('atom-discord.offline', (event, {id}) => {
	sender.setOffline(id);
});
