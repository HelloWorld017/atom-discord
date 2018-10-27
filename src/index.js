const createConfig = require('./config');
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
		const notInitialized = !remote.getGlobal("$ATOM_DISCORD");
		remote.require(SEND_DISCORD_PATH);

		if(notInitialized) {
			ipcRenderer.send('atom-discord.initialize');
		}
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

const updater = {};
const createLoop = () => {
	//Get current editor and subscribe updates.

	let currEditor = null;
	let projectName = null;
	let pluginOnline = true;

	const updateData = () => {
		ipcRenderer.send('atom-discord.data-update', {
			currEditor,
			projectName,
			pluginOnline
		});
	};

	atom.getCurrentWindow().on('blur', () => {
		pluginOnline = false;
		updateData();
	});

	atom.getCurrentWindow().on('focus', () => {
		pluginOnline = true;
		updateData();
	});

	atom.getCurrentWindow().on('close', () => {
		ipcRenderer.send('atom-discord.offline', {id: rendererId});
		pluginOnline = false;
	});

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

module.exports = {
	activate() {
		initialize().then(() => {
			createLoop();

			atom.commands.add('atom-text-editor', "atom-discord:toggle", (ev) => {
				ipcRenderer.send('atom-discord.toggle');
			});

			atom.commands.add('atom-text-editor', "atom-discord:project-customize", (ev) => {
				showCustomizeProject();
			});

			atom.config.onDidChange('atom-discord', ev => {
				setTimeout(() => ipcRenderer.send('atom-discord.updateConfig'), 500);
			});
		});
	},

	config: createConfig(translate)
};
