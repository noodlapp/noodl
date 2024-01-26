import _ from 'underscore';
import React from 'react';
import ReactDOM from 'react-dom';

import { Comment, CommentsModel } from '@noodl-models/commentsmodel';
import KeyboardHandler from '@noodl-utils/keyboardhandler';

import { pointInsideRectangle, rectanglesOverlap } from '../utils/utils';
import * as CommentLayerView from './CommentLayer/CommentLayerView';
import { NodeGraphEditor } from './nodegrapheditor';

function arrayShallowEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export default class CommentLayer {
  nodegraphEditor: NodeGraphEditor;
  props: {
    readOnly: boolean;
    scale: number;
    comments: Comment[];
    selectedIds: string[];
    showTextArea: boolean;
    activeCommentId: string;
    isContextOpen: boolean;
    setIsContextOpen: (state: boolean) => void;
    updateComment: (commentId: string, updatedData: TSFixme, args: TSFixme) => void;
    removeComment: (commentId: string) => void;
    onResizeStart: () => void;
    onResizeStop: () => void;
    setActiveState: (id: string, active: boolean) => void;
    toggleSelection: (id: string) => void;
    setShowTextArea: (show: boolean) => void;
  };
  model: CommentsModel;
  backgroundDiv: HTMLDivElement;
  activeCommentId: string;
  foregroundDiv: HTMLDivElement;

  constructor(nodegraphEditor) {
    this.nodegraphEditor = nodegraphEditor;

    this.props = {
      readOnly: undefined,
      scale: undefined,
      comments: [],
      selectedIds: [],
      showTextArea: false,
      activeCommentId: null,
      isContextOpen: false,
      setIsContextOpen: (state) => {
        this.props.isContextOpen = state;
        this._renderReact();
      },
      updateComment: (commentId, updatedData, args) => {
        const index = this.props.comments.findIndex((c) => c.id === commentId);

        const currentComment = this.props.comments[index];
        const updatedComment = { ...currentComment, ...updatedData };

        this.props.comments[index] = updatedComment;
        this._renderReact();

        if (args && args.commit) {
          this.model.setComment(commentId, updatedComment, { undo: true, label: args.label || 'change comment' });
        }
      },
      removeComment: (commentId) => {
        this.model.removeComment(commentId, { undo: true, label: 'delete comment' });
      },
      onResizeStart: () => {
        this.nodegraphEditor.setMouseEventsEnabled(false);

        this.nodegraphEditor.clearSelection();
        this.nodegraphEditor.relayout();
        this.nodegraphEditor.repaint();
      },
      onResizeStop: () => {
        this.nodegraphEditor.setMouseEventsEnabled(true);
      },
      setActiveState: (id, active) => {
        if (this.props.activeCommentId === id && active === false) {
          //current selection is removed
          this.props.activeCommentId = null;
          this._renderReact();
        } else if (this.props.activeCommentId !== id && active) {
          //new selection
          this._setActiveComment(id);
        }
      },
      toggleSelection: (id) => {
        const index = this.props.selectedIds.indexOf(id);
        if (index === -1) {
          this.props.selectedIds.push(id);
        } else {
          this.props.selectedIds.splice(index, 1);
        }
        this._renderReact();
      },
      setShowTextArea: (show) => {
        if (this.props.showTextArea === show) {
          return;
        }

        this.props.showTextArea = show;
        this._renderReact();
      }
    };
  }

  setComponentModel(model) {
    if (this.model) {
      this.model.off(this);
    }

    if (!model) {
      this.props.comments = [];
      this.clearSelection();
      return;
    }

    const commentModel = model.graph.commentsModel;
    this.model = commentModel;
    this.props.comments = commentModel.getComments();

    commentModel.on(
      'commentsChanged',
      () => {
        this.props.comments = commentModel.getComments();
        this._renderReact();
      },
      this
    );

    this._renderReact();
  }

  _renderReact() {
    if (!this.backgroundDiv) {
      return;
    }

    ReactDOM.render(React.createElement(CommentLayerView.Background, this.props), this.backgroundDiv);
    ReactDOM.render(React.createElement(CommentLayerView.Foreground, this.props), this.foregroundDiv);
  }

  renderTo(backgroundDiv, foregroundDiv) {
    if (this.backgroundDiv) {
      ReactDOM.unmountComponentAtNode(this.backgroundDiv);
      ReactDOM.unmountComponentAtNode(this.foregroundDiv);
    }

    this.backgroundDiv = backgroundDiv;
    this.foregroundDiv = foregroundDiv;
    this.setupMouseEventHandling(foregroundDiv);

    //ugly workaround to make it possible to render the nodegraph in an effect a React component
    //without warnings. React doesn't like if effects trigger react components to render directly.
    setTimeout(() => {
      this._renderReact();
    }, 1);
  }

  hasSelection() {
    return !!this.props.activeCommentId || this.props.selectedIds.length;
  }

  //Set pan and scale position. These transforms must be set when the comments mount since react-rnd checks the bounding box of the parent for the initial poisition
  setPanAndScale(panAndScale) {
    if (!this.backgroundDiv) {
      return;
    }

    const transform = `scale(${panAndScale.scale}) translate(${panAndScale.x}px, ${panAndScale.y}px)`;

    if (this.backgroundDiv.style.transform === transform) return;

    this.backgroundDiv.style.transform = transform;
    this.foregroundDiv.style.transform = transform;

    //let the comments know that scaling has changed so resizing and moving them works
    if (this.props.scale !== panAndScale.scale) {
      this.props.scale = panAndScale.scale;
      this._renderReact();
    }
  }

  setSelectedCommentIds(ids) {
    this.props.activeCommentId = null;
    this.props.selectedIds = ids;
    this.props.showTextArea = false;
    this._renderReact();
  }

  getSelectedComments() {
    return this.props.comments.filter((c) => this.props.selectedIds.includes(c.id));
  }

  deleteSelection(args) {
    const selectedComments = this.getSelectedComments();

    for (const comment of selectedComments) {
      this.model.removeComment(comment.id, args);
    }

    this.clearSelection();
  }

  clearMultiselection() {
    //clear all selections, except the active one (if any)
    this.props.selectedIds = this.props.selectedIds.filter((id) => id !== this.activeCommentId);
    this._renderReact();
  }

  clearSelection() {
    this.props.showTextArea = false;

    if (this.props.selectedIds.length) {
      this.props.activeCommentId = null;
      this.props.selectedIds = [];
      this._renderReact();
    }
  }

  //sets a comment to "active" (white outline)
  _setActiveComment(commentId) {
    if (this.props.activeCommentId === commentId) {
      return;
    }

    this.props.selectedIds = [commentId];
    this.props.activeCommentId = commentId;

    this.props.showTextArea = false; //new selection, so clear this flag

    //make sure we clear any selections in the graph
    this.nodegraphEditor.clearSelection();
    this.nodegraphEditor.relayout();
    this.nodegraphEditor.repaint();

    this._renderReact();
  }

  //select a comment to active and focuses the text area
  focusComment(commentId) {
    this._setActiveComment(commentId);

    this.props.showTextArea = true;
    this._renderReact();
  }

  setReadOnly(readOnly) {
    this.props.readOnly = readOnly;
    this._renderReact();
  }

  performMultiSelect(selectRect, mode) {
    const intersectedComments = this.props.comments.filter((c) => rectanglesOverlap(c, selectRect));

    let commentIds = intersectedComments.map((c) => c.id);

    if (mode === 'union') {
      commentIds = _.union(this.props.selectedIds, commentIds);
    } else if (mode === 'reduce') {
      commentIds = _.difference(this.props.selectedIds, commentIds);
    }

    if (!arrayShallowEqual(this.props.selectedIds, commentIds)) {
      this.props.selectedIds = commentIds;
      this._renderReact();
    }
  }

  moveSelectedComments(dx, dy) {
    if (this.props.selectedIds.length === 0) {
      return;
    }

    for (const commentId of this.props.selectedIds) {
      const index = this.props.comments.findIndex((c) => c.id === commentId);
      const comment = this.props.comments[index];

      const updatedComment = { ...comment, x: comment.x + dx, y: comment.y + dy };

      this.props.comments[index] = updatedComment;
    }
    this._renderReact();
  }

  //save selected comments to the model. Called after a multiselect drag is complete
  commitSelectedComments(args) {
    const comments = this.getSelectedComments();

    for (const comment of comments) {
      this.model.setComment(comment.id, comment, args);
    }
  }

  dispose() {
    ReactDOM.unmountComponentAtNode(this.foregroundDiv);
    ReactDOM.unmountComponentAtNode(this.backgroundDiv);

    //hack to remove all event listeners without having to keep track of them
    const newForegroundDiv = this.foregroundDiv.cloneNode(true);
    this.foregroundDiv.parentNode.replaceChild(newForegroundDiv, this.foregroundDiv);

    if (this.model) {
      this.model.off(this);
    }
  }

  //this is quite hacky... a comment is in front of the comments in the DOM, and will get mouse events before the canvas
  //so we need to figure out when to forward events to the canvas, and when not to (e.g. nodes are visually in front of a comment and should get priority)
  setupMouseEventHandling(foregroundDiv) {
    const events = {
      mousedown: 'down',
      mouseup: 'up',
      mousemove: 'move',
      mouseout: 'out',
      mouseover: 'over',
      click: 'click'
    };

    //node graph editor doesn't use the "click" event, and relies on up/down instead.
    //Let's assume that if the node graph consumed a down or up event, the next "click" event should be consumed as well
    let ignoreNextClick = false;
    let clickIgnoreTimeout;

    //listen for mouse events going into the comment layer
    //and route to the node graph in case it hits a node
    for (const eventName in events) {
      const type = events[eventName];
      foregroundDiv.addEventListener(
        eventName,
        (evt) => {
          if (evt.target && evt.target.closest('.comment-controls')) {
            //we are interacting with the comment controls UI. Just let is through, and don't send events to node graph
            return;
          }

          if (ignoreNextClick && type === 'click') {
            ignoreNextClick = false;
            evt.stopPropagation();
            evt.preventDefault();
            return;
          }

          //check if we're interacting with something in the canvas. If we aren't, then let the comment layer handle the mouse event
          //otherwise, forward the mouse even to the nodegraph
          evt.spaceKey = this.nodegraphEditor.spaceKeyDown; // This is set by the KeyboardHandler

          //nodeGraphEditor expects position argument that's relative to the top left of the canvas
          const tl = this.nodegraphEditor.topLeftCanvasPos;
          const pos = {
            x: evt.pageX - tl[0],
            y: evt.pageY - tl[1],
            pageX: evt.pageX,
            pageY: evt.pageY
          };

          const consumed = this.nodegraphEditor.mouse(type, pos, evt, { eventPropagatedFromCommentLayer: true });

          if (consumed) {
            //stop event to propagate to a comment
            evt.stopPropagation();
            evt.preventDefault();

            if (type === 'down' || type === 'up') {
              //nodeGraphEditor consumed a up or down event, so let's ignore the next click event (which the nodeGraphEditor doesn't care about)
              if (clickIgnoreTimeout) {
                clearTimeout(clickIgnoreTimeout);
              }

              ignoreNextClick = true;
              clickIgnoreTimeout = setTimeout(() => {
                ignoreNextClick = false;
              }, 1000);
            }
          } else {
            //start a multidrag select if we have selected comments, or selected nodes
            const startMultiselectDrag =
              type === 'down' && (this.props.selectedIds.length > 1 || this.nodegraphEditor.selector.active);

            if (startMultiselectDrag) {
              const ngPos = this.nodegraphEditor.relativeCoordsToNodeGraphCords(pos);

              //if we're starting a multi select drag, make sure that we're not starting the drag on top of a comment that's outside the current selection
              const commentUnderCursor = this.props.comments.find((c) => pointInsideRectangle(ngPos, c));
              if (!commentUnderCursor || this.props.selectedIds.includes(commentUnderCursor.id)) {
                this.nodegraphEditor.startDraggingNodes(this.nodegraphEditor.selector.nodes);

                //stop event to propagate to a comment
                evt.stopPropagation();
                evt.preventDefault();
              }
            }
          }
        },
        true
      );
    }

    //listen for mousewheel events on a comment.
    //They should zoom the canvas, except if a text area is active (then it should scroll), or ctrl/cmd is being held down
    foregroundDiv.addEventListener('wheel', (evt) => {
      if (evt.target.tagName !== 'TEXTAREA' || evt.ctrlKey || evt.metaKey) {
        //nodeGraphEditor expects position argument that's relative to the top left of the canvas
        const tl = this.nodegraphEditor.topLeftCanvasPos;
        this.nodegraphEditor.handleMouseWheelEvent(evt, { offsetX: evt.pageX - tl[0], offsetY: evt.pageY - tl[1] });
      }
    });

    //forward key events, except when a text area is active
    foregroundDiv.addEventListener('keydown', (evt) => {
      if (evt.target.tagName !== 'TEXTAREA') {
        //forward this key event to the keyboard handler
        KeyboardHandler.instance.executeCommandMatchingKeyEvent(evt, 'down');
      }
    });
  }
}
