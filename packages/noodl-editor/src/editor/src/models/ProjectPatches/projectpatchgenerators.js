const ScrollBehaviourToScrollEnabled = {
  condition: function (node) {
    return node.type === 'Group' && node.parameters.hasOwnProperty('scrollBehavior');
  },
  generatePatch: function (node) {
    const params = {
      //remove old parameters
      scrollBehavior: null,
      scrollDirection: null
    };

    //add new parameters
    switch (node.parameters.scrollBehavior) {
      case 'native':
        params.scrollEnabled = true;
        params.nativeScroll = true;
        break;
      case 'noodl':
        params.scrollEnabled = true;
        break;
    }

    return {
      nodeId: node.id,
      params
    };
  }
};

const TextAlignmentAlignXNoodl20 = {
  condition: function (node) {
    return node.type === 'Text' && node.parameters.hasOwnProperty('textAlign');
  },
  generatePatch: function (node) {
    const params = {
      //remove old parameter
      textAlign: null,
      //add new
      textAlignX: node.parameters.textAlign
    };

    return {
      nodeId: node.id,
      params
    };
  }
};

const TextAlignment = {
  condition: function (node) {
    return (
      node.type === 'Text' &&
      (node.parameters.hasOwnProperty('justifyContent') || node.parameters.hasOwnProperty('alignItems'))
    );
  },
  generatePatch: function (node) {
    const params = {
      //remove old parameters
      justifyContent: null,
      alignItems: null
    };

    //add new paramters
    switch (node.parameters.justifyContent) {
      case 'flex-start':
        params.textAlignX = 'left';
        break;
      case 'center':
        params.textAlignX = 'center';
        break;
      case 'flex-end':
        params.textAlignX = 'right';
        break;
    }

    switch (node.parameters.alignItems) {
      case 'flex-start':
        params.textAlignY = 'top';
        break;
      case 'center':
        params.textAlignY = 'center';
        break;
      case 'flex-end':
        params.textAlignY = 'bottom';
        break;
    }

    return {
      nodeId: node.id,
      params
    };
  }
};

const EventSenderReceiver = {
  condition: function (node) {
    return node.type === 'Event Sender' && !node.parameters.payload && node.ports && node.ports.length > 0;
  },
  generatePatch: function (node) {
    const payloadPorts = node.ports.filter((p) => p.plug === 'input' && p.group === 'Payload');

    const payload = payloadPorts.map((p) => p.name).join(',');

    return {
      nodeId: node.id,
      params: {
        payload
      },
      portsToDelete: payloadPorts.map((p) => p.name)
    };
  }
};

module.exports = {
  Patches: [
    {
      key: 'ScrollBehaviourToScrollEnabled',
      message: 'Scroll properties have changed and been upgraded',
      notifyUser: true,
      askPermission: false,
      patches: [ScrollBehaviourToScrollEnabled]
    },
    {
      key: 'TextAlignmentAlignXNoodl20',
      message: 'Text nodes now support vertical alignment. Your project has been upgraded',
      notifyUser: true,
      askPermission: false,
      patches: [TextAlignmentAlignXNoodl20]
    },
    {
      key: 'TextAlignment',
      notifyUser: false,
      askPermission: false,
      patches: [TextAlignment]
    },
    {
      key: 'EventSenderReceiver',
      notifyUser: false,
      askPermission: false,
      patches: [EventSenderReceiver]
    }
  ]
};
