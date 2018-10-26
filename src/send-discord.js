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
	privacy: {},
	behaviour: {},
	troubleShooting: {},
	getTranslation(key, args = {}) {
		let tr = config.translations[key];
		if(!tr) return "UNDEFINED_TRANSLATION";

		Object.keys(args).forEach((i) => tr = tr.replace(new RegExp(`%${i}%`, 'g'), args[i]));

		return tr;
	},
	icon: new Map(Object.keys(matched).map((key) => {
		let match = key.match(REGEX_REGEX);
		if(!match) return [key, matched[key]];

		return [new RegExp(match[1], match[2]), matched[key]];
	}))
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
		this.largeImage = null;
		this.startTimestamp = new Date;

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
		if(!config.privacy.sendFilename && this.fileName) details = config.getTranslation('type-unknown');
		if(!config.privacy.sendFileType) largeImageKey = 'text', largeImageText = config.getTranslation('type-unknown');
		if(!config.privacy.sendElapsed) startTimestamp = null;

		// Respect behaviour setting
		if(config.behaviour.preferType) {
			if(this.largeImage.text === config.getTranslation('developer-idle'))
				details = config.getTranslation('editing-idle');
			else
				details = largeImageText
		}

		if(config.behaviour.showFilenameOnLargeImage) {
			largeImageText = this.fileName ? config.getTranslation('editing-file', {
				fileName: this.fileName
			}) : config.getTranslation('developer-idle');

			if(!config.privacy.sendFilename && this.fileName) largeImageText = config.getTranslation('type-unknown');
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

	clearActivity() {
		this.rpc.clearActivity();
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
}

const sender = new DiscordSender();

ipcMain.on(
	'atom-discord.config-update',
	(event, {
		isInit,
		i18n,
		privacy: _privacy,
		behaviour: _behaviour,
		troubleShooting: _troubleShooting
	}) => {
		config.translations = i18n;
		config.behaviour = _behaviour;
		config.privacy = _privacy;
		config.troubleShooting = _troubleShooting;

		if(isInit) {
			logging.log("Initializing Configurations, RPC");

			sender.setupRpc().then((v) => {
				sender.loop();
			}).catch(err => {
				logging.log(util.inspect(err));
			});
		}
	}
);

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
