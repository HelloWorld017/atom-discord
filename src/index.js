const {ipcRenderer, remote} = require('electron');
const matched = require('../data/matched.json');
const path = require('path');
const {promisifyAll} = require('bluebird');

const ATOM_PATH = process.execPath;
const DISCORD_ID = '380510159094546443';
const SEND_DISCORD_PATH = require.resolve('./send-discord.js');
const RPC_PATH = require.resolve('discord-rpc');

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
	behaviour = atom.config.get('atom-discord.behaviour')
) => {
	const i18nValue = require(`../i18n/${i18n}.json`);

	ipcRenderer.send('atom-discord.config-update', {
		i18n: i18nValue,
		privacy,
		behaviour
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

atom.config.onDidChange('atom-discord.behaviour', ({newValue}) => {
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
		behaviour: {
			title: "Behaviour",
			description: "",
			type: "object",
			properties: {
				smallIconToggle: {
					title: "Display small Atom logo",
					description: "",
					type: "boolean",
					default: true
				},

				updateTick: {
					title: "Update tick",
					description: "Interval between state update (ms)",
					type: "number",
					default: 15e3
				}
			},
			order: 1
		},

		i18n: {
			title: "i18n",
			description: "Select Language",
			type: "string",
			default: "en-US",
			enum: [
				{
					value: "nl-NL",
					description: "Dutch (Netherlands)"
				},

				{
					value: "he-IL",
					description: "Hebrew (Israel)"
				},

				{
					value: "no-NO",
					description: "Norwegian (Bokmal)"
				},

				{
					value: "ro-RO",
					description: "Romanian (Romania)"
				},

				{
					value: "en-US",
					description: "English (United States)"
				},

				{
					value: "fr-FR",
					description: "French (France)"
				},

				{
					value: "de-DE",
					description: "German (Germany)"
				},

				{
					value: "it-IT",
					description: "Italian (Italy)"
				},

				{
					value: "ko-KR",
					description: "Korean (Korea)"
				},

				{
					value: "pt-BR",
					description: "Portuguese (Brazil)"
				},

				{
					value: "ru-RU",
					description: "Russian (Russia)"
				}
			],

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
				},

				sendElapsed: {
					title: "Send elapsed time",
					description: "Integrate elapsed time when you started coding.",
					type: "boolean",
					default: true
				}
			},

			order: 3
		}
	}
};
