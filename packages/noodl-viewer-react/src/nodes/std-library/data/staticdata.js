'use strict';

const Collection = require('@noodl/runtime/src/collection');

function CSVToArray(strData, strDelimiter) {
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = strDelimiter || ',';

  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp(
    // Delimiters.
    '(\\' +
      strDelimiter +
      '|\\r?\\n|\\r|^)' +
      // Quoted fields.
      '(?:"([^"]*(?:""[^"]*)*)"|' +
      // Standard fields.
      '([^"\\' +
      strDelimiter +
      '\\r\\n]*))',
    'gi'
  );

  // Create an array to hold our data. Give the array
  // a default empty first row.
  var arrData = [[]];

  // Create an array to hold our individual pattern
  // matching groups.
  var arrMatches = null;

  var prevLastIndex;

  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while ((arrMatches = objPattern.exec(strData)) && prevLastIndex !== objPattern.lastIndex) {
    prevLastIndex = objPattern.lastIndex;

    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[1];

    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
      // Since we have reached a new row of data,
      // add an empty row to our data array.
      arrData.push([]);
    }

    var strMatchedValue;

    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[2]) {
      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      strMatchedValue = arrMatches[2].replace(new RegExp('""', 'g'), '"');
    } else {
      // We found a non-quoted value.
      strMatchedValue = arrMatches[3];
    }

    // Now that we have our value string, let's add
    // it to the data array.
    arrData[arrData.length - 1].push(strMatchedValue);
  }

  // Return the parsed data.
  return arrData;
}

var CSVNode = {
  name: 'Static Data',
  docs: 'https://docs.noodl.net/nodes/data/array/static-array',
  displayNodeName: 'Static Array',
  shortDesc: 'Store static data to populate a Collection with items.',
  category: 'Data',
  color: 'data',
  nodeDoubleClickAction: [
    {
      focusPort: 'JSON'
    },
    {
      focusPort: 'CSV'
    }
  ],
  getInspectInfo() {
    if (this._internal.collection) {
      return [
        {
          type: 'value',
          value: this._internal.collection.items
        }
      ];
    }
  },
  dynamicports: [
    {
      name: 'conditionalports/extended',
      condition: 'type = csv OR type NOT SET',
      inputs: ['csv']
    },
    {
      name: 'conditionalports/extended',
      condition: 'type = json',
      inputs: ['json']
    }
  ],
  inputs: {
    type: {
      type: {
        name: 'enum',
        enums: [
          { label: 'CSV', value: 'csv' },
          { label: 'JSON', value: 'json' }
        ],
        allowEditOnly: true
      },
      displayName: 'Type',
      group: 'General',
      default: 'csv',
      set: function (value) {
        this._internal.type = value;
      }
    },
    csv: {
      type: { name: 'string', codeeditor: 'text', allowEditOnly: true },
      displayName: 'CSV',
      group: 'General',
      set: function (value) {
        this._internal.csv = value;
        this.scheduleParseData();
      }
    },
    json: {
      type: { name: 'string', codeeditor: 'json', allowEditOnly: true },
      displayName: 'JSON',
      group: 'General',
      set: function (value) {
        this._internal.json = value;
        this.scheduleParseData();
      }
    }
  },
  outputs: {
    items: {
      type: 'array',
      displayName: 'Items',
      group: 'General',
      getter: function () {
        return this._internal.collection;
      }
    },
    count: {
      type: 'number',
      displayName: 'Count',
      group: 'General',
      get() {
        return this._internal.collection ? this._internal.collection.size() : 0;
      }
    }
  },
  methods: {
    scheduleParseData: function () {
      var internal = this._internal;
      if (!internal.hasScheduledParseData) {
        internal.hasScheduledParseData = true;
        this.scheduleAfterInputsHaveUpdated(this.parseData.bind(this));
      }
    },
    parseData: function () {
      var internal = this._internal;

      internal.hasScheduledParseData = false;

      internal.collection = Collection.get();

      if (internal.type === undefined || internal.type === 'csv') {
        // Data is string, parse it as CSV
        var data = CSVToArray(internal.csv);
        var json = [];
        var fields = data[0];
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var obj = {};
          for (var j = 0; j < fields.length; j++) {
            obj[fields[j]] = row[j];
          }
          json.push(obj);
        }

        internal.collection.set(json);
        this.flagOutputDirty('items');
        this.flagOutputDirty('count');
      } else if (internal.type === 'json') {
        if (this.context.editorConnection) {
          this.context.editorConnection.clearWarning(this.nodeScope.componentOwner.name, this.id, 'json-parse-warning');
        }

        try {
          const json = JSON.parse(internal.json);
          internal.collection.set(json);
          this.flagOutputDirty('items');
          this.flagOutputDirty('count');
        } catch (e) {
          if (this.context.editorConnection) {
            this.context.editorConnection.sendWarning(
              this.nodeScope.componentOwner.name,
              this.id,
              'json-parse-warning',
              {
                showGlobally: true,
                message: e.message
              }
            );
          }
        }
      }
    }
  }
};

module.exports = {
  node: CSVNode
};
