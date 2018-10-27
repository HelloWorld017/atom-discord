const fs = require('fs');
const {ipcMain, webContents} = require('electron');
const path = require('path');
const util = require('util');
const {Client} = require('../dist/rpc.bundle.js');
const matched = require('../data/matched.json');

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
const REGEX_REGEX = /^\/(.*)\/([mgiy]+)$/;

const config = {
	translations: {},
	behaviour: {},
	smallImage: {},
	largeImage: {},
	state: {},
	detail: {},
	elapsed: {},
	rest: {},
	troubleShooting: {},

	getTranslation(key, args = {}) {
		let tr = config.translations[key];
		if(!tr) return "UNDEFINED_TRANSLATION";

		return config.replaceTranslationArgs(tr, args);
	},

	replaceTranslationArgs(tr, args) {
		Object.keys(args).forEach((i) => tr = tr.replace(new RegExp(`%${i}%`, 'g'), args[i]));

		return tr;
	},

	icon: new Map(Object.keys(matched).map((key) => {
		let match = key.match(REGEX_REGEX);
		if(!match) return [key, matched[key]];

		return [new RegExp(match[1], match[2]), matched[key]];
	})),

	customIcons: {},

	initConfig() {
		config.translations = require(`../i18n/${atomApplication.config.get('atom-discord.i18n')}.json`);

		[
			'behaviour',
			'smallImage',
			'largeImage',
			'state',
			'detail',
			'elapsed',
			'rest',
			'troubleShooting'
		].forEach(k => {
			config[k] = atomApplication.config.get(`atom-discord.${k}`);
			atomApplication.config.onDidChange(`atom-discord.${k}`, ({newValue, oldValue}) => {
				config[k] = newValue;
			});
		});
	}
};

const normalize = (object) => {
	Object.keys(object).forEach((k) => {
		if(object[k] === null){
			delete object[k];
		}
	});

	return object;
};

const logging = {
	enabled: true,
	lastFlush: 0,
	path: '',
	logs: [],
	flushLog() {
		if(this.path === '') return;

		const text = this.logs.join('\n') + '\n';
		this.logs = [];

		if(text.length > 0) fs.appendFile(this.path, text, () => {});
	},

	log(text) {
		if(this.enabled) {
			const date = new Date;
			this.logs.push(`[${date.toTimeString()}] ${text}`);
			if(this.lastFlush + 5000 < Date.now()) {
				setTimeout(() => this.flushLog(), 6000);
				this.lastFlush = Date.now();
			}
		}

		console.log(text);
	}
};

class DiscordSender {
	constructor() {
		this.projectName = null;
		this.fileName = null;
		this.typeDescriptor = null;
		this.textSets = {};
		this.imageSets = {};
		this.startTimestamp = Date.now();
		this.restStartTimestamp = null;
		this.restedAmount = null;

		this.onlineRenderers = {};
		this.rpc = null;
		this.destroied = false;
		this.pauseRequested = false;
		this.paused = false;
	}

	setOnline(id) {
		if(this.onlineRenderers[id]) return;

		let sendAfter = !this.isRendererOnline;
		logging.log(`Editor ${id} became online.`);

		this.onlineRenderers[id] = true;

		if(sendAfter){
			logging.log(`New editor confirmed, sending activities...`);
			this.sendActivity();
		}
	}

	setOffline(id) {
		if(!this.onlineRenderers[id]) return;

		logging.log(`Editor ${id} became offline.`);

		this.onlineRenderers[id] = false;

		if(!this.isRendererOnline) {
			logging.log(`No editor remained, destroying rpc clients...`);
			this.destroyRpc();
		}
	}

	setupRpc() {
		if(this.rpc) return new Promise(resolve => resolve());
		const clientId = config.behaviour.customAppId;

		return new Promise((resolve, reject) => {
			logging.log("Initializing RPC");

			if(typeof Client === 'undefined') return reject("No client available!");

			const rpc = new Client({ transport: 'ipc' });

			let previousPath = process.env.XDG_RUNTIME_DIR;
			if(config.troubleShooting.ubuntuPatch) {
				const { env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP } } = process;
				const prefix = XDG_RUNTIME_DIR || TMPDIR || TMP || TEMP || '/tmp';

				prefix += '/snap.discord';

				process.env.XDG_RUNTIME_DIR = prefix;

				logging.log("Experimental Ubuntu Snap Patch Enabled.");
			}

			rpc.on('ready', () => {
				this.rpc = rpc;
				this.destroied = false;

				if(config.troubleShooting.ubuntuPatch) {
					process.env.XDG_RUNTIME_DIR = previousPath;
				}

				logging.log("Logged in successfully.");
				resolve();
			});

			logging.log(`Logging in RPC with ID ${clientId}`);

			rpc.login({
				clientId
			}).catch(reject);
		});
	}

	async destroyRpc() {
		if(this.destroied) return;
		if(this.rpc === null) return;

		logging.log("Destroying RPC Client...");
		this.destroied = true;

		const _rpc = this.rpc;
		this.rpc = null;

		await _rpc.destroy();
		logging.log("Done destroying RPC Client. It is now safe to turn off the computer.")
	}

	fillValues() {
		this.textSets["false"] = null;

		this.textSets["working-project"] = this.projectName ? config.getTranslation('working-project', {
				projectName: this.projectName
			}) : config.getTranslation('working-no-project');

		this.textSets["editing-file"] = this.fileName ? config.getTranslation('editing-file', {
				fileName: this.fileName
			}) : null;

		this.textSets["type-description"] = this.typeDescriptor.text ? config.getTranslation('type-description', {
				type: this.typeDescriptor.text
			}) : null;

		this.imageSets["false"] = null;
		this.imageSets["currentType"] = this.typeDescriptor.icon;

		if(this.isResting) {
			this.textSets["editing-file"] = this.getTextValue(config.rest.fileName, config.fileNameCustom);
			this.textSets["type-description"] = this.getTextValue(config.rest.typeName, config.typeNameCustom);
		}
	}

	getTextValue(type, custom) {
		if(this.textSets[type]) return this.textSets[type];

		if(type === 'custom') {
			return config.replaceTranslationArgs(custom, {
				projectName: this.projectName,
				fileName: this.fileName,
				type: this.typeDescriptor.text
			});
		}

		return config.getTranslation(type);
	}

	getImageValue(type, custom) {
		if(this.imageSets[type]) return this.imageSets[type];

		if(type === 'custom') {
			type = custom;
		}

		if(config.customIcons[type]) return config.customIcons[type];

		return type;
	}

	sendActivity() {
		if(!this.rpc) return;
		if(!this.isRendererOnline) return;

		const packet = {};

		// Fill state
		packet.state = this.getTextValue(config.state.text, config.state.textCustom);

		// Fill details
		packet.details = this.getTextValue(config.detail.text, config.detail.textCustom);

		// Fill largeImage
		packet.largeImageKey = this.getImageValue(config.largeImage.image, config.largeImage.imageCustom);
		packet.largeImageText = this.getTextValue(config.largeImage.text, config.largeImage.textCustom);

		// Fill smallImage
		packet.smallImageKey = this.getImageValue(config.smallImage.image, config.smallImage.imageCustom);
		packet.smallImageText = this.getTextValue(config.smallImage.text, config.smallImage.textCustom);

		// Fill elapsed
		const timestamp = this.startTimestamp.getTime();
		if(config.elapsed.handleRest === 'pause') {
			if(this.isResting) {
				timestamp += (Date.now() - this.restStartTimestamp);
			} else {
				timestamp += this.restedAmount;
			}
		}
		packet.startTimestamp = config.elapsed.send ? timestamp : null;

		// Resting
		if(this.isResting) {
			packet.smallImageKey = this.getImageValue(config.rest.smallImage, config.rest.smallImageCustom);
			packet.largeImageKey = this.getImageValue(config.rest.largeImage, config.rest.largeImageCustom);
		}


		this.rpc.setActivity(normalize(packet));
	}

	clearActivity() {
		this.rpc.clearActivity();
	}

	updateActivity(projectName, fileName) {
		// Stopped resting
		const resumedActivity = fileName && this.isResting;

		// Set current activity
		this.projectName = projectName;
		this.fileName = fileName;

		// Set type
		if(this.fileName && config.icon) {
			let found = false;

			config.icon.forEach((value, test) => {
				if(found) return;
				let result = false;

				if(typeof test === 'string') result = this.fileName.endsWith(test);
				else if(test.test) result = test.test(this.fileName);

				if(result) {
					found = true;
					this.typeDescriptor = value;
				}
			});

			if(!found) this.typeDescriptor = {
				icon: 'text',
				text: path.extname(this.fileName)
			};

		} else {
			this.typeDescriptor = {
				icon: 'text',
				text: ''
			};
		}

		// Update text, images
		this.fillValues();

		// Update rest-related timestamps
		if(this.isResting) {
			switch(config.elapsed.handleRest) {
				case 'false':
					break;

				case 'reset':
					this.startTimestamp = Date.now();
					break;

				case 'pause':
					this.restStartTimestamp = Date.now();
					break;
			}
		} else if(resumedActivity) {
			switch(config.elapsed.handleRest) {
				case 'false':
					break;

				case 'reset':
					this.startTimestamp = Date.now();
					break;

				case 'pause':
					this.restedAmount += Date.now() - this.restStartTimestamp;
					this.restStartTimestamp = null;
					break;
			}
		}
	}

	async loop() {
		try {
			if(this.destroied) await this.setupRpc(Client)
		} catch(e) {
			logging.log(e.stack);

			const focusedContents = webContents.getFocusedWebContents();
			if(focusedContents) {
				focusedContents.send('atom-discord.noDiscord');
			}
		}

		if(this.isRendererOnline) this.sendActivity();

		if(!this.pauseRequested) {
			setTimeout(this.loopFunction, config.behaviour.updateTick);
		} else {
			this.paused = true;
		}
	}

	pause() {
		if(this.pauseRequested) return;

		this.pauseRequested = true;
	}

	resume() {
		if(!this.pauseRequested) return;

		if(this.paused) {
			this.paused = false;
			this.loop();
		} else {
			this.pauseRequested = false;
		}
	}

	toggle() {
		if(this.pauseRequested) return this.resume();
		this.pause();
	}

	get loopFunction() {
		return this.loop.bind(this);
	}

	get isRendererOnline() {
		return Object.keys(this.onlineRenderers).some((v) => this.onlineRenderers[v]);
	}

	get isResting() {
		return !!this.fileName;
	}
}

logging.log("Initializing configs...");
config.initConfig();

const sender = new DiscordSender();
sender.setupRpc().then((v) => {
	sender.loop();
}).catch(err => {
	logging.log(util.inspect(err));
});

ipcMain.on('atom-discord.logging', (event, {loggable, path}) => {
	logging.enabled = loggable;
	logging.path = path;

	if(logging.enabled) {
		logging.flushLog();
	} else {
		logging.logs = [];
	}
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

ipcMain.on('atom-discord.toggle', (event) => {
	sender.toggle();
});
