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
	"action":"updateStack",
	"stackId":<id>,
	"cards":[
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
	"action":"moveStack",
	"stackId":<id>,
	"x":<Number>,
	"y":<Number>,
	"alpha":<Number>,
	"inHand":<boolean>,
	"final":<boolean>
}
```
`inHand` indicates that this client should enter move mode for this stack
`mId` is not incremented when `final` is `false`.

```json
{
	"mId":<Integer>,
	"action":"createStack",
	"stackId":<id>,
	"cards":[
		{
			"open":<boolean>,
			"deck":<id>,
			"card":<index>
		},
		...
	],
	"x":<Number>,
	"y":<Number>,
	"alpha":<Number>,
	"inHand":<boolean>
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
*Note: Decks are sorted by creation; Stacks by last moved; the stack that was moved the most recently is the last in the list.*

### Client to Server
```json
{
	"action":"resync"
}
```

```json
{
	"action":"moveStack",
	"stackId":<id>,
	"final":<boolean>,
	"x":<Number>,
	"y":<Number>,
	"alpha":<Number>
}
```

```json
{
	"action":"shuffleStack",
	"stackId":<id>
}
```

```json
{
	"action":"reverseStack",
	"stackId":<id>
}
```

```json
{
	"action":"flipStack",
	"stackId":<id>
}
```

```json
{
	"action":"mergeStack",
	"movingStack":<id>,
	"stayingStack":<id>,
	"where": "top" | "bottom" | "middle"
}
```

```json
{
	"action":"takeStack",
	"stackId":<id>,
	"count":<Integer>,
	"where": "top" | "bottom" | "middle"
}
```

```json
{
	"action":"createStack",
	"deckId":<id>
}
```

```json
{
	"action":"filterStack",
	"stackId":<id>,
	"criterion":<String>,
	"value":<String>
}
```