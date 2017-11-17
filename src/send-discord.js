const {ipcMain} = require('electron');
const path = require('path');

const startTimestamp = new Date().getTime() / 1000;
let projectName = null;
let currEditor = null;
let largeImage = null;

let translations = {};
let privacySettings = {};

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

			if(!privacySettings.sendProject) state = getTranslation('working-no-project');
			if(!privacySettings.sendFilename) details = getTranslation('type-unknown');
			if(!privacySettings.sendFileType) largeImageInner = {
					icon: 'text',
					text: getTranslation('type-unknown')
				};

			rpc.setActivity({
				state,
				details,
				startTimestamp,
				largeImageKey: largeImageInner.icon,
				largeImageText: largeImageInner.text,
				smallImageKey: 'atom',
				smallImageText: getTranslation('atom-description')
			});

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

ipcMain.on('atom-discord.config-update', (event, {i18n, privacy}) => {
	translations = i18n;
	privacySettings = privacy;
});

ipcMain.on('atom-discord.discord-setup', (event, arg) => {
	const {Client} = require(arg.rpcPath);
	setupRpc(Client);

	rpc.login(arg.discordId).catch(console.error);

	matchData = arg.matchData;
	matchKeys = Object.keys(matchData);

	console.log("Set up discord RPC.");
});
