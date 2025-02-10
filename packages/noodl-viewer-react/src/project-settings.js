export default {
  ports: [
    {
      name: 'htmlTitle',
      displayName: 'Title',
      group: 'General',
      plug: 'input',
      type: 'string',
      default: 'Fluxscape Viewer',
      tooltip: 'The title that web browsers show',
      ignoreInExport: true
    },
    {
      name: 'headCode',
      displayName: 'Head Code',
      group: 'Custom Code',
      plug: 'input',
      type: {
        name: 'string',
        codeeditor: 'html'
      },
      tooltip: 'Add custom code to the &lt;head&gt; tag',
      ignoreInExport: true
    },
    {
      name: 'navigationPathType',
      displayName: 'URL Path Type',
      group: 'Navigation',
      plug: 'input',
      type: {
        name: 'enum',
        enums: [
          { label: 'Hash', value: 'hash' },
          { label: 'Path', value: 'path' }
        ]
      },
      default: 'hash'
    },
    {
      name: 'bodyScroll',
      displayName: 'Body Scroll',
      group: 'Experimental features',
      plug: 'input',
      type: {
        name: 'boolean'
      },
      tooltip: 'Changes so the &lt;body&gt; tag will scroll by default'
    },
    {
      name: 'repeaterDisabledWhenUnmounted',
      displayName: 'Disable when unmounted',
      group: 'Experimental features - Repeater',
      plug: 'input',
      type: {
        name: 'boolean'
      },
      tooltip: "Repeater will only create components when it's mounted"
    },
    {
      name: 'repeaterCreateComponentsAsync',
      displayName: 'Create asynchronously',
      group: 'Experimental features - Repeater',
      plug: 'input',
      type: {
        name: 'boolean'
      },
      tooltip: 'Repeater items will be created in chunks to keep UI responsive'
    }
  ]
};
