const DisUI = require('../dist/disui.bundle.js');
const fs = require('fs');
const {ipcRenderer, remote} = require('electron');
const matched = require('../data/matched.json');
const path = require('path');
const Vue = require('vue');

const promisify = f => (...args) => new Promise((resolve, reject) => {
	f(...args, (err, ...vals) => {
		if(err) reject(err);

		resolve(...vals);
	});
});

const createVueElement = (name, elem, options) => {
	const targetElem = document.createElement('div');
	const vueElem = document.createElement('div');
	targetElem.appendChild(vueElem);

	const createOption = {
		el: vueElem
	};

	Object.keys(options).forEach(k => createOption[k] = options[k]);
	const vm = new (Vue.extend(elem))(createOption);

	return {
		elem: targetElem,
		vm
	};
};

const SEND_DISCORD_PATH = require.resolve('./send-discord.js');
const config = {
	i18n: {
		default: require('../i18n/en-US.json'),
		value: {}
	},
	directory: path.join(atom.getConfigDirPath(), 'atom-discord'),
	path: path.join(atom.getConfigDirPath(), 'atom-discord', 'customize.json'),
	customization: {},
	usable: true
};


const translate = (key, args = {}) => {
	let tr = config.i18n.value[key];
	if(!tr) tr = config.i18n.default[key] || 'UNDEFINED_TRANSLATION';

	Object.keys(args).forEach((i) => tr = tr.replace(new RegExp(`%${i}%`, 'g'), args[i]));

	return tr;
};

const showError = (key, args, detail) => {
	atom.notifications.addError(
		translate(key, args),
		{
			description: translate(`${key}-desc`, args),
			detail: detail || translate(`${key}-detail`, args)
		}
	);
};

const initialize = async () => {
	I18N_VALUE = require(`../i18n/${atom.config.get('atom-discord.i18n')}.json`);
	remote.require(SEND_DISCORD_PATH);

	// Generating directory
	try {
		const configStat = await promisify(fs.stat)(config.directory);

		if(!configStat.isDirectory()) {
			showError('error-is-file', {directory: config.directory});
			config.usable = false;
		}
	} catch(err) {
		try {
			await promisify(fs.mkdir)(config.directory);
		} catch(err) {
			showError('generate-failed', {file: 'atom-discord'}, err.stack);
			config.usable = false;
		}
	}

	// Generating customize.json
	if(config.usable) {
		try {
			const fileStat = await promisify(fs.stat)(config.path);

			if(!fileStat.isFile()) {
				showError('error-is-directory', {file: 'customize.json', fileFull: config.path});
				config.usable = false;
			}
		} catch(err) {
			await promisify(fs.writeFile)(config.path, JSON.stringify({
				projects: {},
				filetypes: {}
			}));

			showError('generate-failed', {file: 'customize.json'}, err.stack);
			config.usable = false;
		}
	}

	// Reading customize.json, rechecking availability
	if(config.usable) {
		try {
			config.customization = JSON.parse(await promisify(fs.readFile)(config.path));
		} catch(err) {
			showError('read-failed', {file: 'customize.json'}, err.stack);
			config.usable = false;
		}
	}
};

const showCustomizeProject = () => {
	let isInProject = false;
	let projetPath = '';

	let onlineEditor = atom.workspace.getActiveTextEditor();
	if (onlineEditor && onlineEditor.buffer && onlineEditor.buffer.file) {
		projectPath = atom.project.relativizePath(onlineEditor.buffer.file.path)[0];
		isInProject = true;
	}

	if(!isInProject) {
		atom.notifications.addInfo(translate('not-in-project'));
		return;
	}

	const {elem, vm} = createVueElement('custom-name-prompt', DisUI.DisPrompt, {
		propsData: {
			title: translate('custom-name'),
			primary: translate('custom-name-primary'),
			secondary: translate('custom-name-secondary')
		}
	});

	const panel = atom.workspace.addModalPanel({
		item: elem
	});

	const destroy = () => {
		vm.$destroy();
		panel.destroy();
		saveCustomization();
		updater.updateProjectName();
	};

	vm.$on('primary', customName => {
		if(!config.customization.projects) config.customization.projects = {};
		config.customization.projects[projectPath] = customName;
		destroy();
	});

	vm.$on('secondary', () => {
		config.customization.projects[projectPath] = undefined;
		destroy();
	});
};

const saveCustomization = async () => {
	if(!config.usable) return;

	try {
		await promisify(fs.writeFile)(config.path, JSON.stringify(config.customization));
	} catch(err) {
		showError('write-failed', {file: customize.json}, err.stack);
	}
};

const updateConfig = (
	i18n = atom.config.get('atom-discord.i18n'),
	privacy = atom.config.get('atom-discord.privacy'),
	behaviour = atom.config.get('atom-discord.behaviour')
) => {
	config.i18n.value = require(`../i18n/${i18n}.json`);

	ipcRenderer.send('atom-discord.config-update', {
		i18n: config.i18n.value,
		privacy,
		behaviour
	});
};

const updater = {};
const createLoop = () => {
	let pluginOnline = true;

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

	//Get current editor and subscribe updates.

	let currEditor = null;
	let projectName = null;

	const updateData = () => {
		ipcRenderer.send('atom-discord.data-update', {
			currEditor,
			projectName
		});
	};


	let onlineEditor = atom.workspace.getActiveTextEditor();
	if(onlineEditor && onlineEditor.getTitle) currEditor = onlineEditor.getTitle();

	const updateProjectName = () => {
		if (onlineEditor && onlineEditor.buffer && onlineEditor.buffer.file) {
			const projectPath = atom.project.relativizePath(onlineEditor.buffer.file.path)[0];

			if(!projectPath) projectName = null;
			else {
				projectName = path.basename(projectPath);

				if(config.usable && config.customization.projects) {
					const customizedName = config.customization.projects[projectPath];

					if(customizedName) projectName = customizedName;
				}
			}
		} else projectName = null;
	};

	atom.workspace.onDidChangeActiveTextEditor((editor) => {
		onlineEditor = editor;

		if(editor && editor.getTitle) {
			currEditor = editor.getTitle();
			updateProjectName()
		}
		else currEditor = null;

		updateData();
	});

	atom.project.onDidChangePaths((projectPaths) => {
		updateProjectName();
		updateData();
	});

	updateProjectName();
	updateData();

	updater.updateProjectName = updateProjectName;
	updater.updateData = updateData;

	const rendererId = Math.random().toString(36).slice(2);
	ipcRenderer.send('atom-discord.online', {id: rendererId});
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
		initialize().then(() => {
			updateConfig();
			createLoop();

			atom.commands.add('atom-text-editor', "atom-discord:toggle", (ev) => {
				ipcRenderer.send('atom-discord.toggle');
			});

			atom.commands.add('atom-text-editor', "atom-discord:project-customize", (ev) => {
				showCustomizeProject();
			});
		});
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

				preferType: {
					title: "Prefer file type",
					description: "Send file type as description instead of file name.",
					type: "boolean",
					default: false
				},

				showFilenameOnLargeImage: {
					title: "Show file name on large image",
					description: "",
					type: "boolean",
					default: false
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
				},

				useRestIcon: {
					title: "Use rest icon",
					description: "Use rest icon for idle status.",
					type: "boolean",
					default: true
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
					value: "he-IL",
					description: "Hebrew (Israel)"
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
					value: "no-NO",
					description: "Norwegian (Bokmal)"
				},

				{
					value: "pl-PL",
					description: "Polish (Poland)"
				},

				{
					value: "pt-BR",
					description: "Portuguese (Brazil)"
				},

				{
					value: "ro-RO",
					description: "Romanian (Romania)"
				},

				{
					value: "ru-RU",
					description: "Russian (Russia)"
				},

				{
					value: "es-ES",
					description: "Spanish (Spain)"
				}
			],

			order: 2
		},

		privacy: {
			title: "Privacy",
			description: "Select things to integrate",
			type: "object",
			properties: {
				sendLargeImage: {
					title: "Display large file type image",
					description: "",
					type: "boolean",
					default: true
				},

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
