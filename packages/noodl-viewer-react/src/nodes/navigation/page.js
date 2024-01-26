import { META_TAGS, Page } from '../../components/navigation/Page';
import NodeSharedPortDefinitions from '../../node-shared-port-definitions';
import { createNodeFromReactComponent } from '../../react-component-node';

const PageNode = {
  name: 'Page',
  displayNodeName: 'Page',
  category: 'Visuals',
  docs: 'https://docs.noodl.net/nodes/navigation/page',
  useVariants: false,
  mountedInput: false,
  allowAsExportRoot: false,
  singleton: true,
  connectionPanel: {
    groupPriority: ['General', 'Mounted']
  },
  initialize: function () {
    this.props.layout = 'column'; //this allows the children to know what type of layout type they're in
    if (this.isInputConnected('onPageReady')) {
      this.nodeScope.context.eventEmitter.emit('SSR_PageLoading', this.id);
    }
  },
  defaultCss: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    alignItems: 'flex-start',
    flex: '1 1',
    alignSelf: 'stretch'
  },
  getReactComponent() {
    return Page;
  },
  inputs: {
    // TODO: Enable with SSR
    // onPageReady: {
    //   displayName: 'Page Ready',
    //   type: 'signal',
    //   valueChangedToTrue() {
    //     this.nodeScope.context.eventEmitter.emit('SSR_PageReady', this.id);
    //   }
    // },
    sitemapIncluded: {
      index: 80001,
      displayName: 'Included',
      group: 'Experimental Sitemap',
      default: true,
      type: {
        name: 'boolean',
        allowEditOnly: true
      }
    },
    sitemapChangefreq: {
      index: 80002,
      displayName: 'Change Freq',
      group: 'Experimental Sitemap',
      default: 'weekly',
      type: {
        name: 'enum',
        allowEditOnly: true,
        enums: [
          { label: 'always', value: 'always' },
          { label: 'hourly', value: 'hourly' },
          { label: 'daily', value: 'daily' },
          { label: 'weekly', value: 'weekly' },
          { label: 'monthly', value: 'monthly' },
          { label: 'yearly', value: 'yearly' },
          { label: 'never', value: 'never' }
        ]
      }
    },
    sitemapPriority: {
      index: 80003,
      displayName: 'Priority',
      group: 'Experimental Sitemap',
      default: 0.5,
      type: {
        name: 'number',
        allowEditOnly: true
      }
    }
    // NOTE: Hide this for now, this is going to be important for SSR
    // sitemapScript: {
    //   index: 80004,
    //   displayName: 'Script',
    //   group: 'Sitemap',
    //   type: {
    //     name: 'string',
    //     allowEditOnly: true,
    //     codeeditor: 'javascript'
    //   }
    // }
  },
  inputProps: META_TAGS.reduce((result, x, index) => {
    result[x.key] = {
      index: 80000 + index,
      displayName: x.displayName,
      editorName: x.editorName || x.displayName,
      propPath: 'metatags',
      group: x.group,
      popout: x.popout,
      type: x.type || 'string'
    };
    return result;
  }, {}),
  methods: {
    getUrlPath: function () {
      return this._internal.urlPath;
    },
    getTitle: function () {
      return this._internal.title;
    },
    /* setRouter:function(value) {
            this._internal.router = value
        },*/
    setTitle: function (value) {
      this._internal.title = value;
    },
    setUrlPath: function (value) {
      this._internal.urlPath = value;
    },
    registerInputIfNeeded: function (name) {
      if (this.hasInput(name)) {
        return;
      }

      /*   if (name === 'router') return this.registerInput(name, {
                set: this.setRouter.bind(this)
            })*/

      if (name === 'title')
        return this.registerInput(name, {
          set: this.setTitle.bind(this)
        });

      if (name === 'urlPath')
        return this.registerInput(name, {
          set: this.setUrlPath.bind(this)
        });
    }
  },
  setup(context, graphModel) {
    if (!context.editorConnection || !context.editorConnection.isRunningLocally()) {
      return;
    }

    function _managePortsForNode(node) {
      function _updatePorts() {
        var ports = [];

        // Show router selector if more that one
        /*	var routers = graphModel.getNodesWithType('Router')
                if(routers.length > 1) {
                    ports.push({
                        plug: 'input',
                        type: { name: 'enum', enums: routers.map((r) => ({ label: (r.parameters['name'] || 'Main'), value: (r.parameters['name'] || 'Main') })), allowEditOnly: true },
                        group: 'General',
                        displayName: 'Router',
                        name: 'router',
                        default:'Main'
                    })
                }*/

        // Title and urlpath ports
        const titleParts = node.component.name.split('/');
        ports.push({
          name: 'title',
          displayName: 'Title',
          type: 'string',
          group: 'General',
          plug: 'input',
          default: titleParts[titleParts.length - 1]
        });

        const title = node.parameters['title'] || titleParts[titleParts.length - 1];
        const defaultUrlPath = title.replace(/\s+/g, '-').toLowerCase();
        ports.push({
          name: 'urlPath',
          displayName: 'Url Path',
          type: 'string',
          group: 'General',
          plug: 'input',
          default: defaultUrlPath
        });

        context.editorConnection.sendDynamicPorts(node.id, ports);
      }

      _updatePorts();
      node.on('parameterUpdated', function (ev) {
        if (ev.name === 'title') _updatePorts();
      });

      //  graphModel.on("nodeAdded.Router", _updatePorts)
      //  graphModel.on("nodeWasRemoved.Router", _updatePorts)
    }

    graphModel.on('editorImportComplete', () => {
      graphModel.on('nodeAdded.Page', function (node) {
        _managePortsForNode(node);
      });

      graphModel.on('componentRenamed', function (component) {
        const page = graphModel.getNodesWithType('Page').filter((x) => component.roots.includes(x.id));
        if (page.length > 0) {
          _managePortsForNode(page[0]);
        }
      });

      for (const node of graphModel.getNodesWithType('Page')) {
        _managePortsForNode(node);
      }
    });
  }
};

//NodeSharedPortDefinitions.addSharedVisualInputs(PageNode);
NodeSharedPortDefinitions.addPaddingInputs(PageNode);

export default createNodeFromReactComponent(PageNode);
