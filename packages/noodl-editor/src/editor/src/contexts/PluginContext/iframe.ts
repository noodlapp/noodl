import * as Notify from './commands/notify';
import * as UploadAwsS3 from './commands/upload-aws-s3';

type IFrameCommand = Notify.Command | UploadAwsS3.Command;

const commands: Record<IFrameCommand['kind'], (command: IFrameCommand, event: MessageEvent) => Promise<void>> = {
  notify: Notify.execute,
  'upload-aws-s3': UploadAwsS3.execute
};

export function commandEventHandler(event: MessageEvent) {
  try {
    const command = event.data;
    const handler = commands[command.kind];
    handler && handler(command, event);
  } catch (error) {
    console.error(error);
  }
}
