const i18nList = require('../i18n/index.json');

module.exports = function createConfig(translate) {
	const textEnum = [
		{
			value: 'false',
			description: translate('config-text-disabled')
		},

		{
			value: 'working-project',
			description: translate('working-project')
		},

		{
			value: 'editing-file',
			description: translate('editing-file')
		},

		{
			value: 'type-description',
			description: translate('type-description')
		},

		{
			value: 'type-unknown',
			description: translate('type-unknown')
		},

		{
			value: 'atom-description',
			description: translate('atom-description')
		},

		{
			value: 'custom',
			description: translate('config-text-custom')
		}
	];

	const imageEnum = [
		{
			value: 'false',
			description: translate('config-image-disabled')
		},

		{
			value: "currentType",
			description: translate('config-image-currentType')
		},

		{
			value: "customImage",
			description: translate('config-image-customImage')
		},

		{
			value: "atom-original",
			description: translate('config-image-atom-original')
		},

		{
			value: "atom",
			description: translate('config-image-atom')
		},

		{
			value: "atom-2",
			description: translate('config-image-atom-2')
		},

		{
			value: "atom-3",
			description: translate('config-image-atom-3')
		},

		{
			value: "atom-5",
			description: translate('config-image-atom-5')
		},

		{
			value: "text",
			description: translate('config-image-text')
		}
	];

	const imageEnumRest = [].concat([
		{
			value: 'rest',
			description: translate('config-image-rest')
		},

		{
			value: 'default',
			description: translate('config-image-default')
		}
	], imageEnum).filter(v => v.value !== 'currentType');

	const textEnumRest = [
		{
			value: 'false',
			description: translate('config-text-disabled')
		},

		{
			value: 'editing-idle',
			description: translate('editing-idle')
		},

		{
			value: 'developer-idle',
			description: translate('developer-idle')
		},

		{
			value: 'custom',
			description: translate('config-text-custom')
		}
	];

	const createTextProperties = (textDefault) => {
		return {
			text: {
				title: translate('config-text'),
				description: translate('config-text-desc'),
				type: 'string',
				enum: textEnum,
				default: textDefault,
				order: 1
			},

			textCustom: {
				title: translate('config-textCustom'),
				description: translate('config-textCustom-desc'),
				type: 'string',
				default: '',
				order: 2
			}
		};
	};

	const createImageTextProperties = (imageDefault, textDefault) => {
		return {
			image: {
				title: translate('config-image'),
				description: translate('config-image-desc'),
				type: 'string',
				enum: imageEnum,
				default: imageDefault,
				order: 1
			},

			imageCustom: {
				title: translate('config-imageCustom'),
				description: translate('config-imageCustom-desc'),
				type: 'string',
				default: '',
				order: 2
			},

			text: {
				title: translate('config-text'),
				description: translate('config-text-desc'),
				type: 'string',
				enum: textEnum,
				default: textDefault,
				order: 3
			},

			textCustom: {
				title: translate('config-textCustom'),
				description: translate('config-textCustom-desc'),
				type: 'string',
				default: '',
				order: 4
			}
		};
	};

	return {
		i18n: {
			title: "i18n",
			description: "Select Language",
			type: "string",
			default: "en-US",
			enum: i18nList,
			order: 1
		},

		behaviour: {
			title: translate('config-behaviour'),
			description: "",
			type: "object",
			properties: {
				updateTick: {
					title: translate('config-behaviour-updateTick'),
					description: translate('config-behaviour-updateTick-desc'),
					type: "number",
					default: 15e3,
					order: 1
				},

				customAppId: {
					title: translate('config-behaviour-customAppId'),
					description: translate('config-behaviour-customAppId-desc'),
					type: "string",
					default: '380510159094546443',
					order: 2
				}
			},
			order: 2
		},

		smallImage: {
			title: translate('config-smallImage'),
			description: translate('config-smallImage-desc'),
			type: 'object',
			properties: createImageTextProperties('atom', 'atom-description'),
			order: 3
		},

		largeImage: {
			title: translate('config-largeImage'),
			description: translate('config-largeImage-desc'),
			type: 'object',
			properties: createImageTextProperties('currentType', 'type-description'),
			order: 4
		},

		state: {
			title: translate('config-state'),
			description: translate('config-state-desc'),
			type: 'object',
			properties: createTextProperties('editing-file'),
			order: 5
		},

		detail: {
			title: translate('config-detail'),
			description: translate('config-detail-desc'),
			type: 'object',
			properties: createTextProperties('working-project'),
			order: 6
		},

		elapsed: {
			title: translate('config-elapsed'),
			description: translate('config-elapsed-desc'),
			type: 'object',
			properties: {
				send: {
					title: translate('config-elapsed-send'),
					description: translate('config-elapsed-send-desc'),
					type: 'boolean',
					default: true,
					order: 1
				},

				handleRest: {
					title: translate('config-elapsed-handleRest'),
					description: translate('config-elapsed-handleRest-desc'),
					type: 'string',
					enum: [
						{
							value: 'false',
							description:
								`[${translate('config-elapsed-handleRest-disabled')}] ` +
								translate('config-elapsed-handleRest-disabled-desc')
						},

						{
							value: 'reset',
							description:
								`[${translate('config-elapsed-handleRest-reset')}] ` +
								translate('config-elapsed-handleRest-reset-desc')
						},

						{
							value: 'resetAfterDelay',
							description:
								`[${translate('config-elapsed-handleRest-resetAfterDelay')}] ` +
								translate('config-elapsed-handleRest-resetAfterDelay-desc')
						},

						{
							value: 'pause',
							description:
								`[${translate('config-elapsed-handleRest-pause')}] ` +
								translate('config-elapsed-handleRest-pause-desc')
						}
					],
					default: 'false',
					order: 2
				},

				handleRestDelay: {
					title: translate('config-elapsed-handleRestDelay'),
					description: translate('config-elapsed-handleRestDelay-desc'),
					type: 'number',
					default: 60,
					order: 3
				}
			},
			order: 7
		},

		rest: {
			title: translate('config-rest'),
			description: translate('config-rest-desc'),
			type: 'object',
			properties: {
				restOnBlur: {
					title: translate('config-rest-restOnBlur'),
					description: translate('config-rest-restOnBlur-desc'),
					type: 'boolean',
					default: false,
					order: 1
				},

				restOnAfk: {
					title: translate('config-rest-restOnAfk'),
					description: translate('config-rest-restOnAfk-desc'),
					type: 'boolean',
					default: false,
					order: 2
				},

				restOnAfkThreshold: {
					title: translate('config-rest-restOnAfkThreshold'),
					description: translate('config-rest-restOnAfkThreshold-desc'),
					type: 'number',
					default: 180,
					order: 3
				},

				smallImage: {
					title: translate('config-rest-smallImage'),
					description: translate('config-rest-smallImage-desc'),
					type: 'string',
					enum: imageEnumRest,
					default: 'default',
					order: 4
				},

				smallImageCustom: {
					title: translate('config-rest-smallImageCustom'),
					description: translate('config-rest-smallImageCustom-desc'),
					type: 'string',
					default: '',
					order: 5
				},

				smallImageText: {
					title: translate('config-rest-smallImageText'),
					description: translate('config-rest-smallImageText-desc'),
					type: 'string',
					enum: [
						{
							value: 'false',
							description: translate('config-text-disabled')
						},

						{
							value: 'atom-description',
							description: translate('atom-description')
						},

						{
							value: 'editing-idle',
							description: translate('editing-idle')
						},

						{
							value: 'developer-idle',
							description: translate('developer-idle')
						},

						{
							value: 'custom',
							description: translate('config-text-custom')
						}
					],
					default: 'atom-description',
					order: 6
				},

				smallImageTextCustom: {
					title: translate('config-rest-smallImageTextCustom'),
					description: translate('config-rest-smallImageTextCustom-desc'),
					type: 'string',
					default: '',
					order: 7
				},

				largeImage: {
					title: translate('config-rest-largeImage'),
					description: translate('config-rest-largeImage-desc'),
					type: 'string',
					enum: imageEnumRest,
					default: 'rest',
					order: 8
				},

				largeImageCustom: {
					title: translate('config-rest-largeImageCustom'),
					description: translate('config-rest-largeImageCustom-desc'),
					type: 'string',
					default: '',
					order: 9
				},

				// Large Image Text (for backward-compatibility)
				typeName: {
					title: translate('config-rest-typeName'),
					description: translate('config-rest-typeName-desc'),
					type: 'string',
					enum: textEnumRest,
					default: 'developer-idle',
					order: 10
				},

				typeNameCustom: {
					title: translate('config-rest-typeNameCustom'),
					description: translate('config-rest-typeNameCustom-desc'),
					type: 'string',
					default: '',
					order: 11
				},

				// State (for backward-compatibility)
				fileName: {
					title: translate('config-rest-fileName'),
					description: translate('config-rest-fileName-desc'),
					type: 'string',
					enum: textEnumRest,
					default: 'editing-idle',
					order: 12
				},

				fileNameCustom: {
					title: translate('config-rest-fileNameCustom'),
					description: translate('config-rest-fileNameCustom-desc'),
					type: 'string',
					default: '',
					order: 13
				},

				detail: {
					title: translate('config-rest-detail'),
					description: translate('config-rest-detail-desc'),
					type: 'string',
					enum: [
						{
							value: 'false',
							description: translate('config-text-disabled')
						},

						{
							value: 'working-project',
							description: translate('working-project')
						},

						{
							value: 'editing-idle',
							description: translate('editing-idle')
						},

						{
							value: 'developer-idle',
							description: translate('developer-idle')
						},

						{
							value: 'custom',
							description: translate('config-text-custom')
						}
					],
					default: 'working-project',
					order: 14
				},

				detailCustom: {
					title: translate('config-rest-detailCustom'),
					description: translate('config-rest-detailCustom-desc'),
					type: 'string',
					default: '',
					order: 15
				}
			},
			order: 8
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

			order: 9
		}
	};
};
