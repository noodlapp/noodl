import { isEqual } from 'underscore';

import { UndoQueue } from '@noodl-models/undo-queue-model';

import Model from '../../../shared/model';
import { guid } from '../utils/utils';

export type Comment = {
  id?: string;
  text: string;
  fill: boolean;
  width: number;
  height: number;
  x: number;
  y: number;
  color?: string; // logic, visual, component, data, script, comment
};

export class CommentsModel extends Model {
  comments: Comment[];

  constructor(args) {
    super();
    this.comments = args.comments || [];
  }

  addComment(comment: Comment, args?) {
    if (!comment.id) {
      comment.id = guid();
    }

    this.comments.push(comment);
    this.notifyListeners('commentsChanged');

    this.notifyListeners('commentAdded', { comment, args });

    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;
      undo.push({
        label: args.label,
        do: () => {
          this.addComment(comment);
        },
        undo: () => {
          this.removeComment(comment.id);
        }
      });
    }
  }

  removeComment(commentId: Comment['id'], args?) {
    const index = this.comments.findIndex((c) => c.id === commentId);
    if (index === -1) {
      console.log('CommentsModel::delete', 'comment with id', commentId, "doesn't exist");
      return;
    }

    const removedComment = this.comments[index];

    this.comments.splice(index, 1);
    this.notifyListeners('commentsChanged');

    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;
      undo.push({
        label: args.label,
        do: () => {
          this.removeComment(commentId);
        },
        undo: () => {
          this.addComment(removedComment);
        }
      });
    }
  }

  setComment(commentId: Comment['id'], commentData, args?) {
    const index = this.comments.findIndex((c) => c.id === commentId);
    if (index === -1) {
      console.log('CommentsModel::setComment', 'comment with id', commentId, "doesn't exist");
      return;
    }

    const oldComment = { ...this.comments[index] };

    const comment = { ...commentData };

    //save some disk space by rounding these looong numbers
    comment.x = Math.round(comment.x);
    comment.y = Math.round(comment.y);

    if (isEqual(oldComment, comment)) {
      //there was no change, just return
      return;
    }

    this.comments[index] = comment;
    this.notifyListeners('commentsChanged');

    if (args && args.undo) {
      const undo = typeof args.undo === 'object' ? args.undo : UndoQueue.instance;
      undo.push({
        label: args.label,
        do: () => {
          this.setComment(commentId, comment);
        },
        undo: () => {
          this.setComment(commentId, oldComment);
        }
      });
    }
  }

  getComments() {
    //return a copy so caller is free to modify their array
    return [...this.comments];
  }

  dispose() {
    // noop
  }
}
