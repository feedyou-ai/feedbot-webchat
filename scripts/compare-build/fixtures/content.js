// Fixed content for browser-fixtures.js: the remote config, bot activities and images.
const zlib = require('zlib');

const FIXTURE_ORIGIN = 'https://fixture.invalid';
// The id must be the hosting id (`bot.id` in the snippet), the widget replaces its typing indicator with the
// first message from it. Card buttons and suggested actions are only shown on the last activity.
const HOSTING_ID = 'fixture-bot-app';
const BOT = { id: HOSTING_ID, name: 'Chatbot' };
const TIMESTAMP = '2026-01-01T10:00:00.000Z';

// Every template the remote config can select (src/themes/index.ts). A config without a template is left out:
// the widget throws on it (Header doesTemplateSupportPopupMsg reads props.theme.template), in the baseline too.
const TEMPLATES = ['expandable-bar', 'expandable-knob', 'expandable-knob-v2', 'sidebar', 'sidebar-v2', 'full-screen', 'assistant'];

function imageUrl(name) {
	return `${FIXTURE_ORIGIN}/images/${name}.png`;
}

// The response of https://<bot>.azurewebsites.net/webchat/config, shaped like a real one.
function remoteConfig(templateType) {
	return {
		config: {
			type: 'webchat',
			disabled: false,
			visibility: 'always',
			showInput: 'always',
			consolePlaceholder: '',
			locale: 'cs-cz',
			persist: 'none',
			botName: 'Chatbot',
			mainColor: '#2a7d4f',
			template: templateType
				? {
						type: templateType,
						headerText: 'Fixture bot',
						collapsedHeaderText: 'Napište nám',
						iconUrl: imageUrl('icon'),
						avatarUrl: imageUrl('avatar'),
						logoUrl: imageUrl('logo'),
						supportiveTitle: 'Jsme tu pro vás',
						welcomeTitle: 'Dobrý den, jak vám můžu pomoci?',
						exampleQueries: ['Otevírací doba', 'Stav objednávky'],
						persistentMenu: [{ title: 'Kontakt', dialog: 'fixture-contact-dialog' }]
					}
				: undefined,
			genAi: {
				disclaimerEnabled: true,
				ratingRoles: ['user'],
				explanationRoles: [],
				customExplanations: [],
				customDisclaimerText: 'Odpověď vygenerovala AI.'
			},
			signature: { mode: 'feedyou' },
			urlFilter: [],
			userData: [],
			handoff: { type: 'none' },
			id: 'fixture'
		},
		testMode: false,
		directLineBotId: '',
		conversationId: 'fixture-conversation',
		token: 'fixture-token',
		expires_in: 3600
	};
}

const heroCard = index => ({
	contentType: 'application/vnd.microsoft.card.hero',
	content: {
		title: `Produkt ${index}`,
		subtitle: `Varianta ${index}`,
		text: 'Krátký popis produktu, který se může zalomit na více řádků.',
		images: [{ url: imageUrl(`product-${index}`) }],
		buttons: [
			{ type: 'imBack', title: 'Vybrat', value: `Produkt ${index}` },
			{ type: 'openUrl', title: 'Detail', value: 'https://example.com/' }
		]
	}
});

// Bot messages, sent one step at a time. Each step's `act` runs after the message is shown, see browser-fixtures.js.
const MESSAGES = {
	welcome: {
		type: 'message',
		text: 'Dobrý den 👋, tady **fixture bot**.\n\n- první bod\n- druhý bod s [odkazem](https://example.com/)',
		suggestedActions: {
			actions: [
				{ type: 'imBack', title: 'Ano', value: 'Ano' },
				{ type: 'imBack', title: 'Ne', value: 'Ne' }
			]
		}
	},
	adaptiveCard: {
		type: 'message',
		attachments: [
			{
				contentType: 'application/vnd.microsoft.card.adaptive',
				content: {
					type: 'AdaptiveCard',
					version: '1.0',
					body: [
						{ type: 'TextBlock', text: 'Rezervace', size: 'large', weight: 'bolder' },
						{ type: 'TextBlock', text: 'Vyplňte prosím údaje 😀', wrap: true },
						{ type: 'Image', url: imageUrl('card'), size: 'medium' },
						{
							type: 'ColumnSet',
							columns: [
								{ type: 'Column', items: [{ type: 'TextBlock', text: 'Cena' }] },
								{ type: 'Column', items: [{ type: 'TextBlock', text: '1 200 Kč', horizontalAlignment: 'right' }] }
							]
						},
						{
							type: 'FactSet',
							facts: [
								{ title: 'Datum', value: '1. 1. 2027' },
								{ title: 'Místo', value: 'Praha' }
							]
						},
						{ type: 'Input.Text', id: 'name', placeholder: 'Jméno' },
						{
							type: 'Input.ChoiceSet',
							id: 'size',
							style: 'expanded',
							value: 'm',
							choices: [
								{ title: 'Malý', value: 's' },
								{ title: 'Střední', value: 'm' }
							]
						},
						{ type: 'Input.Toggle', id: 'agree', title: 'Souhlasím', value: 'false' }
					],
					actions: [
						{ type: 'Action.Submit', title: 'Odeslat', data: { action: 'submit' } },
						{ type: 'Action.OpenUrl', title: 'Web', url: 'https://example.com/' }
					]
				}
			}
		]
	},
	carousel: {
		type: 'message',
		attachmentLayout: 'carousel',
		attachments: [1, 2, 3, 4].map(heroCard)
	},
	list: {
		type: 'message',
		attachmentLayout: 'list',
		attachments: [
			{
				contentType: 'application/vnd.microsoft.card.thumbnail',
				content: {
					title: 'Náhledová karta',
					subtitle: 'Podtitulek',
					text: 'Text karty',
					images: [{ url: imageUrl('thumbnail') }],
					buttons: [{ type: 'imBack', title: 'Zvolit', value: 'Náhled' }]
				}
			},
			{
				contentType: 'application/vnd.microsoft.card.receipt',
				content: {
					title: 'Účtenka',
					facts: [{ key: 'Objednávka', value: '1234' }],
					items: [{ title: 'Položka', price: '100 Kč', quantity: '2', image: { url: imageUrl('item') } }],
					tax: '21 Kč',
					total: '221 Kč'
				}
			},
			{ contentType: 'image/png', contentUrl: imageUrl('photo'), name: 'photo.png' }
		]
	},
	// The widget shows the upload button only while the last bot message expects an upload.
	uploadRequest: {
		type: 'message',
		text: 'Nahrajte prosím obrázek.',
		inputHint: 'expectingUpload'
	},
	sources: {
		type: 'message',
		text:
			'Odpověď podle dokumentace. ' +
			`[[1]](${FIXTURE_ORIGIN}/api/messages/kb/fixture-kb/documents/fixture-doc/preview#source=https%3A%2F%2Fexample.com%2Fzdroj) ` +
			'[[2]](https://example.com/jiny-zdroj)'
	}
};

// A gradient PNG, so that scaling or cropping differences show up in screenshots.
function png(width, height, seed) {
	const raw = Buffer.alloc((width * 3 + 1) * height);
	for (let y = 0; y < height; y++) {
		const row = y * (width * 3 + 1);
		for (let x = 0; x < width; x++) {
			raw[row + 1 + x * 3] = (x * 255 / width + seed * 60) & 255;
			raw[row + 2 + x * 3] = (y * 255 / height) & 255;
			raw[row + 3 + x * 3] = (seed * 97) & 255;
		}
	}
	const chunk = (type, data) => {
		const length = Buffer.alloc(4);
		length.writeUInt32BE(data.length);
		const typeAndData = Buffer.concat([Buffer.from(type, 'latin1'), data]);
		const crc = Buffer.alloc(4);
		crc.writeUInt32BE(zlib.crc32(typeAndData));
		return Buffer.concat([length, typeAndData, crc]);
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(width, 0);
	header.writeUInt32BE(height, 4);
	header.set([8, 2, 0, 0, 0], 8);
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', header),
		chunk('IDAT', zlib.deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0))
	]);
}

function imageForName(name) {
	let seed = 0;
	for (const character of name) {
		seed = (seed * 31 + character.charCodeAt(0)) % 1000;
	}
	return png(320, 200, seed);
}

module.exports = { FIXTURE_ORIGIN, HOSTING_ID, BOT, TIMESTAMP, TEMPLATES, remoteConfig, MESSAGES, imageForName };
