const {ipcRenderer, remote} = require('electron');
const matched = require('../data/matched.json');
const path = require('path');
const {promisifyAll} = require('bluebird');

const SEND_DISCORD_PATH = require.resolve('./send-discord.js');
const RPC_PATH = require.resolve('discord-rpc');

const initializeSender = () => {
	remote.require(SEND_DISCORD_PATH);
};

const initializeRpc = () => {
	ipcRenderer.send('atom-discord.discord-setup', {
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
	const rendererId = Math.random().toString(36).slice(2);

	let pluginOnline = true;

	ipcRenderer.send('atom-discord.online', {id: rendererId});

	atom.getCurrentWindow().on('blur', () => {
		pluginOnline = false;
	});

	atom.getCurrentWindow().on('focus', () => {
		pluginOnline = true;
	});

	atom.getCurrentWindow().on('close', () => {
		ipcRenderer.send('atom-discord.offline', {id: rendererId});
		pluginOnline = false;
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

atom.config.onDidChange('atom-discord.privacy', ({newValue}) => {
	updateConfig(undefined, newValue);
});

atom.config.onDidChange('atom-discord.behaviour', ({newValue}) => {
	updateConfig(undefined, undefined, newValue)
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
				sendSmallImage: {
					title: "Display small Atom logo",
					description: "",
					type: "boolean",
					default: true
				},

				sendLargeImage: {
					title: "Display large file type image",
					description: "",
					type: "boolean",
					default: true
				},

				updateTick: {
					title: "Update tick",
					description: "Interval between state update (ms)",
					type: "number",
					default: 15e3
				},

				alternativeIcon: {
					title: "Atom Icon",
					description: "Select icon for small icons",
					type: "string",
					enum: [
						{
							value: "atom-original",
							description: "Original Atom Icon"
						},

						{
							value: "atom",
							description: "Atom Alternative Icon 1 (Monotone)"
						},

						{
							value: "atom-2",
							description: "Atom Alternative Icon 2 (Gradient)"
						},

						{
							value: "atom-3",
							description: "Atom Alternative Icon 3 (Polyhedron)"
						},

						{
							value: "atom-5",
							description: "Atom Alternative Icon 4 (Dark, Rhombus)"
						}
					],
					default: "atom"
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
