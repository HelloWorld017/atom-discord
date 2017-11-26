const {ipcMain} = require('electron');
const path = require('path');
const snekfetch = require("snekfetch")
const startTimestamp = new Date().getTime() / 1000;
let projectName = null;
let currEditor = null;
let largeImage = null;
let translations = {};
let privacySettings = {};
let showSmallIcon = true;

let matchData;
let matchKeys = [];
let rpc;

const REGEX_REGEX = /^\/(.*)\/([mgiy]+)$/;

const getTranslation = (key, args = {}) => {
	let tr = translations[key];
	if(!tr) return "UNDEFINED_TRANSLATIONS";

	Object.keys(args).forEach((i) => tr = tr.replace(new RegExp(`%${i}%`, 'g'), args[i]));

	return tr;
};

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

const setupRpc = (Client) => {
	rpc = new Client({ transport: 'ipc' });

	rpc.on('ready', () => {
		const loop = () => {
			let state = projectName ? getTranslation('working-project', {
				projectName
			}) : getTranslation('working-no-project');

			let details = currEditor ? getTranslation('editing-file', {
				fileName: currEditor
			}) : getTranslation('editing-idle');

			let largeImageInner = largeImage;

			let smallImageKey = 'atom';


			if(!privacySettings.sendProject) state = getTranslation('working-no-project');
			if(!privacySettings.sendFilename) details = getTranslation('type-unknown');
			if(!privacySettings.sendFileType) largeImageInner = {
					icon: 'text',
					text: getTranslation('type-unknown')
				};

			const packet = {
				state,
				details,
				startTimestamp,
				endTimestamp: startTimestamp + 3000,
				largeImageKey: largeImageInner.icon,
				largeImageText: largeImageInner.text,
			};

			if(showSmallIcon) {
				packet.smallImageKey = smallImageKey;
				packet.smallImageText = getTranslation('atom-description')
			}

			rpc.setActivity(packet);

			setTimeout(loop, 3000);
		};

		loop();
	});
};

ipcMain.on('atom-discord.data-update', (event, arg) => {
	projectName = arg.projectName;
	currEditor = arg.currEditor;

	if(currEditor && matchKeys) {
		largeImage = matchData[matchKeys.find((k) => {
			if(k.startsWith('.') && currEditor.endsWith(k)) return true;

			let match = k.match(REGEX_REGEX);
			if(!match) return false;

			const regex = new RegExp(match[1], match[2]);
			return regex.test(currEditor);
		})];

		if(!largeImage) largeImage = {
			icon: 'text',
			text: path.extname(currEditor)
		};

		//Deep copying
		largeImage = {
			icon: largeImage.icon,
			text: largeImage.text
		};

		largeImage.text = getTranslation('type-description', {
			type: largeImage.text
		});
	} else {
		largeImage = {
			icon: 'text',
			text: getTranslation('developer-idle')
		};
	}
});

ipcMain.on('atom-discord.config-update', (event, {i18n, privacy, showSmallIcon: _showSmallIcon}) => {
	translations = i18n;
	privacySettings = privacy;
	showSmallIcon = _showSmallIcon
});

ipcMain.on('atom-discord.discord-setup', (event, arg) => {
	const {Client} = require(arg.rpcPath);
	setupRpc(Client);

	rpc.login(arg.discordId).catch(console.error);

	matchData = arg.matchData;
	matchKeys = Object.keys(matchData);

	console.log("Set up discord RPC.");
});
