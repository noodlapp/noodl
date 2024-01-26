# Interactive tutorials HOWTO

## Keyboard shortcuts

- `Shift + Cmd + T`: Restart tutorial
- `Shift + Cmd + R`: Reload lesson (and images). Doesn't restart tutorial
- `Shift + Cmd + N`: Jump to next step even if conditions aren't correct

## Tutorial file format

A tutorial is written in a .html file.

A step can be one of the following:

1. A modal popup. Intended to be used as the first step to explain the tutorial, but can be used anywhere during the tutorial.

An item that shows up in the "tutorial bar" at the bottom:

2. An item can have conditions, in which case the popup only is shown when the user clicks the item
3. An item without conditions will show the popup automatically

### Step with just a modal

A popup in middle of screen you have to dismiss to continue

```html
<div data-template="popup">... any html ...</div>
```

Example:

```html
<div data-template="popup">
  <img src="cool-gif.gif" />
  <h2>Welcome to this tutorial</h2>
  <p>You're going to learn some awesome stuff</p>
</div>
```

### Step without conditions

It's recommended to use `<h2>` in the item

Format is as follows:

```html
<div>
  <div data-template="item">
    <header>...header text and stuff ...</header>
    <h2>Some text</h2>
  </div>
  <div data-template="popup">... popup content ...</div>
</div>
```

Example:

```html
<div>
  <div>
    <div data-template="item">
      <header>Info</header>
      <h2>The node graph</h2>
    </div>
    <div data-template="popup">
      <img src="node-graph.gif" />
      <h2>The node graph</h2>
      <p>Some text</p>
    </div>
  </div>
</div>
```

### Step with conditions

Format is same as above, with two additions. Conditions and a checkmark.
It's recommended to use `<h3>` in the item.

```html
<div data-conditions="[ list of conditions as json ]" }>
  <div data-template="item">
    <header>...header text and stuff ... <span class="lesson-checkmark"></span></header>
    <h3>Some text</h3>
  </div>
  <div data-template="popup">... popup content ...</div>
</div>
```

Example:

```html
<div
  data-conditions='[
        {"path":"/App:%Group:0","exists":true}
    ]'
>
  <div data-template="item">
    <header>Task <span class="lesson-checkmark"></span></header>
    <h3>Drag the text node back to make it visible again</h3>
  </div>

  <div data-template="popup">
    <img src="drag-text-out.gif" />
  </div>
</div>
```

### Step width

A step can have a custom width. Useful if the text doesnät fit the standard size:

```html
<div>
  <div data-template="item" style="width: 300px">...</div>
  <div data-template="popup">...</div>
</div>
```

## Conditions

A step can have conditions that are required to evaluate to true before the user can proceed to the next step.

### Paths

All conditions point to one or more node.
The path to a node is specified by using a path that starts with the component name, and then any of the following tokens:

- `#label`: Look for a node with a label that matches the specified label
- `%type`: Look for a node of a specific type
- `2`: Look for a child index (in this case child 2, the third child)

The first part of a path is always a component.
Second part looks for a root node that matches the token.
Third part will look for a child in the matched root node.
... and so on.

Example:

- `/Main:%Group`: "/Main" component -> Any root node with the type "Group". If there's more than one Group root node then the condition will just pick the first one it finds.
- `/Main:%Group:%Button`: "/Main" component -> Any root node with the type "Group" -> First child that with the type "Button".
- `/Main:#Some Label`: "/Main" component -> A root node with the label "Some Label"
- `/Main:#Some Label:0`: "/Main" component -> A root node with the label "Some Label -> First child
- `/Main:#Some Label:%Button`: "/Main" component -> A root node with the label "Some Label -> First child with the type "Button"
- `/#Sheet A/Comp A:JavaScriptFunction`: Sheet "Sheet A" component "Comp A" -> A root node with the type "Function" (check project.json for the node types if unsure)

### Check if a node exist or not at the specified path:

Check if there's a node at the specified path

```json
{"path":"/App:#root:1", "exists":true}]
```

Or the inverse, that there's no node at that path

```json
{"path":"/App:#root:1", "exists":false}]
```

### Check for connection

Check if there's a connection between two nodes between the specified ports.

```json
{
  "from": "/App:#nodeLabelA",
  "to": "/App:#nodeLabelB",
  "hasconnection": "sourcePortName,targetPortName"
}
```

### Check if a node has a specific label

```json
{
  "path": "/App:#root:1",
  "haslabel": "Some label"
}
```

### Check if a node has a specific type

```json
{
  "path": "/App:#root:1",
  "hastype": "Group"
}
```

### Check if paramters are set on a node

Check if a node has any value set on one or more paramters.

```json
{
  "path": "/App:#root:1",
  "hasparams": "marginLeft,marginRight"
}
```

### Check parameters on a node

Check the value of one or more paramters. The values are the ones specified in the `project.json` file, so take a look there if unsure.

```json
{
  "path": "/App:#root:1",
  "paramseq": {
    "color": "#000000",
    "width": { "value": 300, "unit": "px" },
    "alignX": "center",
    "alignY": "center",
    "sizeMode": "contentSize"
  }
}
```

Example: Check for states in a state node

```json
{
  "path": "/App:#root:1",
  "paramseq": {
    "paramseq": {
      "states": "Visible,Hidden",
      "values": "Opacity"
    }
  }
}
```

### Check if a port exists on a node

Check if a node has a certain port.

```json
{
  "path": "/App:#some function node",
  "hasport": "myInput"
  }
}
```

## Actions from buttons

### Exiting a lesson from a click event

A `data-click` attribute can be added on an HTML tag to make it trigger certain actions in the editor.

### Exiting a lesson

```html
<button style="width: 150px" data-click="exitEditor">EXIT LESSON</button>
```

## Examples of common nodes with non-obvious names

### Check if an Object node has certain properties.

NOTE: the order the properties are created matters, so they should be done step by step instead of all at once

```json
{
  "path": "/My component:%Model2",
  "paramseq": {
    "properties": "url,author"
  }
}
```

### Check connection from Object node

```json
{
  "from": "/My component:%Model2",
  "to": "/My component::%Image",
  "hasconnection": "prop-url,src"
}
```

### Check if a Page Router has certain pages

NOTE: the order the pages does <b>NOT</b> matters, so adding multiple pages in one step is fine.

```json
{
  "path": "/App:%Group:%Router",
  "paramseq": {
    "pages": {
      "routes": ["/Page 1", "/Page 2", "/Page 3"]
    }
  }
}
```

### Check if a Page Router has a specific start page

```json
{
  "path": "/App:%Group:%Router",
  "paramseq": {
    "pages": {
      "startPage": "/Page 2"
    }
  }
}
```

### Check if a Navigate node points to a specific target page

```json
{
  "path": "/App:%RouterNavigate",
  "paramseq": {
    "target": "/Page 2"
  }
}
```

### Check a Page Input for a specific input and if it's connected

NOTE: if there's more than one page paramter, then it behaves like an Object. It's a comma separated list, and the order is important.

```json
[
  {
    "path": "/Page 1:%PageInputs",
    "paramseq": {
      "pathParams": "myPageInput"
    }
  },
  {
    "from": "/Page 1:%PageInputs",
    "to": "/Page 1:%Page:%Text",
    "hasconnection": "pm-myPageInput,text"
  }
]
```
