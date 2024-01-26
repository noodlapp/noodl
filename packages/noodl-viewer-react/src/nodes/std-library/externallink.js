const ExternalLinkNode = {
  name: 'net.noodl.externallink',
  displayNodeName: 'External Link',
  docs: 'https://docs.noodl.net/nodes/navigation/external-link',
  category: 'Navigation',
  nodeDoubleClickAction: {
    focusPort: 'link'
  },
  inputs: {
    link: {
      type: 'string',
      displayName: 'Link'
    },
    openInNewTab: {
      type: 'boolean',
      displayName: 'Open In New Tab',
      default: true
    },
    do: {
      type: 'signal',
      displayName: 'Do',
      valueChangedToTrue() {
        const openInNewTab = this.getInputValue('openInNewTab');
        const params = openInNewTab ? 'noopener,noreferrer' : '';
        const target = openInNewTab === true || openInNewTab === undefined ? '_blank' : '_self';

        window.open(this.getInputValue('link'), target, params);
      }
    }
  }
};

export default {
  node: ExternalLinkNode
};
