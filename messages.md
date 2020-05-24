# Networking messages draft:

[[TOC]]

### Server to client:
```json
{
	"mId":<Integer>,
	"action":"loadDeck",
	"deckId":<id>,
	"file":<url>
}
```

```json
{
	"mId":<Integer>,
	"action":"updateStackContents",
	"stackId":<id>,
	"contents":[
		{
			"open":<boolean>,
			"deck":<id>,
			"card":<index>
		},
		...
	]
}
```

```json
{
	"mId":<Integer>,
	"action":"updateStackPosition",
	"stackId":<id>,
	"x":<Number>,
	"y":<Number>,
	"alpha":<Number>
}
```

```json
{
	"mId":<Integer>,
	"action":"createStack",
	"stackId":<id>,
	"contents":[
		{
			"open":<boolean>,
			"deck":<id>,
			"card":<index>
		},
		...
	],
	"x":<Number>,
	"y":<Number>,
	"alpha":<Number>
}
```
*Note: card index refers to position in csv after dropping empty rows, but including 0-count cards*


```json
{
	"mId":<Integer>,
	"action":"deleteStack",
	"stackId":<id>
}
```

```json
{
	"mId":<Integer>,
	"action":"resync",
	"decks":[
		{
			"deckId":<id>,
			"file":<url>
		},
		...
	],
	"stacks":[
		{
			"stackId":<id>,
			"contents":[
				{
					"open":<boolean>,
					"deck":<id>,
					"card":<index>
				},
				...
			],
			"x":<Number>,
			"y":<Number>,
			"alpha":<Number>
		},
		...
	]
}
```
*Note: Decks are sorted by creation; Stacks by last moved.*