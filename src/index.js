const {ipcRenderer, remote} = require('electron');
const matched = require('../data/matched.json');
const path = require('path');
const {promisifyAll} = require('bluebird');
const Registry = require('winreg');

const ATOM_PATH = process.execPath;
const DISCORD_ID = '380510159094546443';
const REGISTRY_BASEPATH = `\\Software\\Classes\\discord-${DISCORD_ID}`;
const SEND_DISCORD_PATH = require.resolve('./send-discord.js');
const RPC_PATH = require.resolve('discord-rpc');

const getRegistry = (path) => {
	return promisifyAll(new Registry({
		hive: Registry.HKCU,
		key: `${REGISTRY_BASEPATH}${path}`
	}));
};

const setupDiscord = async () => {
	const regKey = getRegistry('');
	const iconKey = getRegistry('\\DefaultIcon');
	const openKey = getRegistry('\\shell\\open\\command');

	if(await regKey.keyExistsAsync()) {
		if(await openKey.getAsync(Registry.DEFAULT_VALUE) === ATOM_PATH) return;
	} else {
		await regKey.createAsync();
		await regKey.setAsync(Registry.DEFAULT_VALUE, "REG_SZ", `URL:Run game ${DISCORD_ID} protocol`);
		await regKey.setAsync("URL Protocol", "REG_SZ", "");
	}

	await iconKey.createAsync();
	await iconKey.setAsync(Registry.DEFAULT_VALUE, "REG_SZ", ATOM_PATH);

	await openKey.createAsync();
	await openKey.setAsync(Registry.DEFAULT_VALUE, "REG_SZ", ATOM_PATH);
};

const initializeSender = () => {
	remote.require(SEND_DISCORD_PATH);
};

const initializeRpc = () => {
	ipcRenderer.send('atom-discord.discord-setup', {
		discordId: DISCORD_ID,
		rpcPath: RPC_PATH,
		matchData: matched
	});
};

const updateConfig = (
	i18n = atom.config.get('atom-discord.i18n'),
	privacy = atom.config.get('atom-discord.privacy'),
	showSmallIcon = atom.config.get('atom-discord.smallIconToggle')
) => {
	const i18nValue = require(`../i18n/${i18n}.json`);

	ipcRenderer.send('atom-discord.config-update', {
		i18n: i18nValue,
		privacy,
		 small_icon_value
	});
};

const createLoop = async () => {
	let pluginOnline = true;

	atom.getCurrentWindow().on('blur', () => {
		pluginOnline = false;
	});

	atom.getCurrentWindow().on('focus', () => {
		pluginOnline = true;
	});

	let currEditor = null;
	let projectName = null;

	const updateData = () => {
		ipcRenderer.send('atom-discord.data-update', {
			currEditor,
			projectName
		});
	};

	//Get current editor and subscribe updates.
	let editor = atom.workspace.getActiveTextEditor();
	if(editor && editor.getTitle) currEditor = editor.getTitle();

	atom.workspace.onDidChangeActiveTextEditor((editor) => {
		if(editor && editor.getTitle) currEditor = editor.getTitle();
		else currEditor = null;

		updateData();
	});

	//Get current project and subscribe updates.
	atom.project.onDidChangePaths((projectPaths) => {
		paths = atom.project.getPaths();
		if(paths.length > 0) projectName = path.basename(paths[0]);
		else projectName = null;

		updateData();
	});

	if(atom.project.getPaths().length > 0)
		projectName = path.basename(atom.project.getPaths()[0]);

	updateData();
};

atom.config.onDidChange('atom-discord.i18n', ({newValue}) => {
	updateConfig(newValue);
});

atom.config.onDidChange('atom-discord.smallIconToggle', ({newValue}) => {
	updateConfig()
});

atom.config.onDidChange('atom-discord.privacy', ({newValue}) => {
	updateConfig(undefined, newValue);
});

module.exports = {
	activate() {
		initializeSender();
		initializeRpc();
		updateConfig();
		createLoop();
	},

	config: {
		i18n: {
			title: "i18n",
			description: "Select Language",
			type: "string",
			default: "en-US",
			enum: [
				{
					value: "en-US",
					description: "English"
				},

				{
					value: "ko-KR",
					description: "Korean"
				},

				{
					value: "fr-FR",
					description: "French"
				}
			],

			order: 1
		},

		 smallIconToggle: {
			title: "Display small Atom logo",
			description: "",
			type: "boolean",
			default: true,
			order: 2
		},

		privacy: {
			title: "Privacy",
			description: "Select things to integrate",
			type: "object",
			properties: {
				sendFilename: {
					title: "Send File name",
					description: "Integrate file name.",
					type: "boolean",
					default: true
				},

				sendProject: {
					title: "Send Project name",
					description: "Integrate project name.",
					type: "boolean",
					default: true
				},

				sendFileType: {
					title: "Send file type",
					description: "Integrate type of files.",
					type: "boolean",
					default: true
				}
			},

			order: 3
		}
	}
};
