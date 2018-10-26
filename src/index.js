const DisUI = require('../dist/disui.bundle.js');
const fs = require('fs');
const {ipcRenderer, remote} = require('electron');
const i18nList = require('../i18n/index.json');
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
		value: require(`../i18n/${atom.config.get('atom-discord.i18n')}.json`)
	},
	directory: path.join(atom.getConfigDirPath(), 'atom-discord'),
	path: path.join(atom.getConfigDirPath(), 'atom-discord', 'customize.json'),
	logPath: path.join(atom.getConfigDirPath(), 'atom-discord', 'log.txt'),
	customization: {},
	usable: true,
	loggable: atom.config.get('atom-discord.troubleShooting.debugLog')
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

	if(detail) console.error("[atom-discord ERROR]", detail);
};

const initialize = async () => {
	try {
		remote.require(SEND_DISCORD_PATH);
	} catch(err) {
		showError('error-while-require', {}, err.stack);
	}

	// Generating directory
	try {
		const configStat = await promisify(fs.stat)(config.directory);

		if(!configStat.isDirectory()) {
			showError('error-is-file', {directory: config.directory});
			config.usable = false;
			config.loggable = false;
		}
	} catch(err) {
		try {
			await promisify(fs.mkdir)(config.directory);
		} catch(err) {
			showError('generate-failed', {file: 'atom-discord'}, err.stack);
			config.usable = false;
			config.loggable = false;
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

	if(config.loggable) {
		try {
			await promisify(fs.writeFile)(config.logPath, '');
		} catch(err) {
			showError('generate-failed', {file: 'log.txt'}, err.stack);
			config.loggable = false;
		}
	}

	ipcRenderer.send('atom-discord.logging', {loggable: config.loggable, path: config.logPath});
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
	isInit = false,
	i18n = atom.config.get('atom-discord.i18n'),
	privacy = atom.config.get('atom-discord.privacy'),
	behaviour = atom.config.get('atom-discord.behaviour'),
	troubleShooting = atom.config.get('atom-discord.troubleShooting')
) => {
	config.i18n.value = require(`../i18n/${i18n}.json`);

	ipcRenderer.send('atom-discord.config-update', {
		isInit,
		i18n: config.i18n.value,
		privacy,
		behaviour,
		troubleShooting
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

	if(atom.config.get('atom-discord.troubleShooting.noDiscordNotification')) {
		ipcRenderer.once('atom-discord.noDiscord', () => {
			showError('error-no-discord');
		});
	}
};

atom.config.onDidChange('atom-discord.i18n', ({newValue}) => {
	updateConfig(false, newValue);
});

atom.config.onDidChange('atom-discord.privacy', ({newValue}) => {
	updateConfig(false, undefined, newValue);
});

atom.config.onDidChange('atom-discord.behaviour', ({newValue}) => {
	updateConfig(false, undefined, undefined, newValue);
});

atom.config.onDidChange('atom-discord.troubleShooting', ({newValue}) => {
	updateConfig(false, undefined, undefined, undefined, newValue);
});

module.exports = {
	activate() {
		initialize().then(() => {
			updateConfig(true);
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
			title: translate('config-behaviour'),
			description: "",
			type: "object",
			properties: {
				sendSmallImage: {
					title: translate('config-behaviour-sendSmallImage'),
					description: "",
					type: "boolean",
					default: true,
					order: 1
				},

				sendLargeImage: {
					title: translate('config-behaviour-sendLargeImage'),
					description: "",
					type: "boolean",
					default: true,
					order: 2
				},

				preferType: {
					title: translate('config-behaviour-preferType'),
					description: translate('config-behaviour-preferType-desc'),
					type: "boolean",
					default: false,
					order: 3
				},

				showFilenameOnLargeImage: {
					title: translate('config-behaviour-showFilenameOnLargeImage'),
					description: translate('config-behaviour-showFilenameOnLargeImage-desc'),
					type: "boolean",
					default: false,
					order: 4
				},

				alternativeIcon: {
					title: translate('config-behaviour-alternativeIcon'),
					description: translate('config-behaviour-alternativeIcon-desc'),
					type: "string",
					enum: [
						{
							value: "atom-original",
							description: translate('config-behaviour-alternativeIcon-atom-original')
						},

						{
							value: "atom",
							description: translate('config-behaviour-alternativeIcon-atom')
						},

						{
							value: "atom-2",
							description: translate('config-behaviour-alternativeIcon-atom-2')
						},

						{
							value: "atom-3",
							description: translate('config-behaviour-alternativeIcon-atom-3')
						},

						{
							value: "atom-5",
							description: translate('config-behaviour-alternativeIcon-atom-5')
						}
					],
					default: "atom",
					order: 5
				},

				useRestIcon: {
					title: translate('config-behaviour-useRestIcon'),
					description: translate('config-behaviour-useRestIcon-desc'),
					type: "boolean",
					default: true,
					order: 6
				},

				updateTick: {
					title: translate('config-behaviour-updateTick'),
					description: translate('config-behaviour-updateTick-desc'),
					type: "number",
					default: 15e3,
					order: 7
				},

				customAppId: {
					title: translate('config-behaviour-customAppId'),
					description: translate('config-behaviour-customAppId-desc'),
					type: "string",
					default: '380510159094546443',
					order: 8
				}
			},
			order: 1
		},

		i18n: {
			title: "i18n",
			description: "Select Language",
			type: "string",
			default: "en-US",
			enum: i18nList,
			order: 2
		},

		privacy: {
			title: translate('config-privacy'),
			description: translate('config-privacy-desc'),
			type: "object",
			properties: {
				sendFilename: {
					title: translate('config-privacy-sendFilename'),
					description: translate('config-privacy-sendFilename-desc'),
					type: "boolean",
					default: true
				},

				sendProject: {
					title: translate('config-privacy-sendProject'),
					description: translate('config-privacy-sendProject-desc'),
					type: "boolean",
					default: true
				},

				sendFileType: {
					title: translate('config-privacy-sendFileType'),
					description: translate('config-privacy-sendFileType-desc'),
					type: "boolean",
					default: true
				},

				sendElapsed: {
					title: translate('config-privacy-sendElapsed'),
					description: translate('config-privacy-sendElapsed-desc'),
					type: "boolean",
					default: true
				}
			},

			order: 3
		},

		troubleShooting: {
			title: translate('config-troubleshooting'),
			description: translate('config-troubleshooting-desc'),
			type: "object",
			properties: {
				ubuntuPatch: {
					title: translate('config-troubleshooting-ubuntuPatch'),
					description: translate('config-troubleshooting-ubuntuPatch-desc'),
					type: "boolean",
					default: false,
					order: 1
				},

				debugLog: {
					title: translate('config-troubleshooting-debugLog'),
					description: translate('config-troubleshooting-debugLog-desc'),
					type: "boolean",
					default: false,
					order: 2
				},

				noDiscordNotification: {
					title: translate('config-troubleshooting-noDiscordNotification'),
					description: translate('config-troubleshooting-noDiscordNotification-desc'),
					type: "boolean",
					default: false,
					order: 3
				}
			},

			order: 4
		}
	}
};
