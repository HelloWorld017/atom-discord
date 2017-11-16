const {ipcMain} = require('electron');

const startTimestamp = new Date().getTime() / 1000;
let projectName = null;
let currEditor = null;
let matchData = undefined;
let isRegex = undefined;
let rpc = undefined;

const setupRpc = (Client) => {
	rpc = new Client({ transport: 'ipc' });

	rpc.on('ready', () => {
		const loop = () => {
			//TODO
			const largeImageKey
			matchData.find((v) => {
				if(isRegex(v)) 
			});
			
			rpc.setActivity({
				state: projectName ? `Working on ${projectName}` : "WORKING!!",
				details: (currEditor) ? `Editing ${currEditor}` : 'Idle',
				startTimestamp,
				largeImageKey: 'js_working',
				largeImageText: 'Coding with JavaScript',
				smallImageKey: 'atom',
				smallImageText: 'Working with Atom'
			});

			setTimeout(loop, 3000);
		};

		loop();
	});
};

ipcMain.on('data-update', (event, arg) => {
	projectName = arg.projectName;
	currEditor = arg.currEditor;
});

ipcMain.on('discord-setup', (event, arg) => {
	const {Client} = require(arg.rpcPath);
	setupRpc(Client);

	rpc.login(arg.discordId).catch(console.error);
	
	matchData = arg.matchData;
	isRegex = require(arg.isRegexPath);

	console.log("Set up discord RPC.");
});
