import s3 from 's3';
import { filesystem, platform } from '@noodl/platform';

import { Environment, EnvironmentDataFormat } from '@noodl-models/CloudServices';
import { ProjectModel } from '@noodl-models/projectmodel';
import { createEditorCompilation } from '@noodl-utils/compilation/compilation.editor';
import { guid } from '@noodl-utils/utils';

import { ToastLayer } from '../../../views/ToastLayer';

export type Command = {
  kind: 'upload-aws-s3';
  taskId: string;
  cloudService: EnvironmentDataFormat;
  s3: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    region: string;
    bucket: string;
    prefix: string;
  }
  messages: {
    progress: string;
    success: string;
    failure: string;
  }
  // Initial version to a more extendable system that can be used with these
  // kind of events.
  events: {
    complete: {
      kind: "fetch",
      resource: string,
      options: RequestInit
    }[]
  }
};

export async function execute(command: Command, event: MessageEvent) {
  const project = ProjectModel.instance;
  const taskId = command.taskId || guid();

  // Setup the build steps
  const compilation = createEditorCompilation(project).addProjectBuildScripts();

  // Create a temp folder
  const tempDir = platform.getTempPath() + '/upload-' + taskId;

  // Deploy to temp folder
  await compilation.deployToFolder(tempDir, {
    environment: command.cloudService ? new Environment(command.cloudService) : undefined
  });

  // Upload to S3
  try {
    await uploadDirectory(
      {
        localDir: tempDir,
        accessKeyId: command.s3.accessKeyId,
        secretAccessKey: command.s3.secretAccessKey,
        sessionToken: command.s3.sessionToken,
        region: command.s3.region,
        bucket: command.s3.bucket,
        prefix: command.s3.prefix
      },
      ({ progress, total }) => {
        ToastLayer.showProgress(command.messages.progress, (progress / total) * 100, taskId);
      }
    );

    ToastLayer.showSuccess(command.messages.success);
  } catch (error) {
    console.error(error);
    ToastLayer.showError(command.messages.failure);
  } finally {
    ToastLayer.hideProgress(taskId);
  }

  // Clean up the temp folder
  filesystem.removeDirRecursive(tempDir);

  // NOTE: Would be nice to clean up the events in here, so "complete" is like
  // "finally". And then also have "success" and "failure".

  // Notify that the process is done
  event.source.postMessage({
    kind: "upload-aws-s3",
    id: taskId,
    status: "complete",
  }, { targetOrigin: event.origin })

  // Execute complete event
  if (Array.isArray(command?.events?.complete)) {
    for (const event of command.events.complete) {
      if (event.kind === "fetch") {
        await fetch(event.resource, event.options);
      } else {
        console.error("invalid event type", event);
      }
    }
  }
}

function uploadDirectory(
  options: {
    localDir: string;
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    region: string;
    bucket: string;
    prefix: string;
  },
  progress: (args: { progress: number; total: number }) => void
) {
  return new Promise<void>((resolve, reject) => {
    // https://github.com/noodlapp/node-s3-client?tab=readme-ov-file#create-a-client
    const client = s3.createClient({
      maxAsyncS3: 20, // this is the default
      s3RetryCount: 3, // this is the default
      s3RetryDelay: 1000, // this is the default
      multipartUploadThreshold: 20971520, // this is the default (20 MB)
      multipartUploadSize: 15728640, // this is the default (15 MB)
      s3Options: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
        sessionToken: options.sessionToken,
        region: options.region
      }
    });

    function getFileCacheControl(fullPath: string) {
      switch (fullPath.split('.').at(-1)) {
        case 'html':
          return 'no-cache';
        default: {
          const TIME_1 = 31536000; // 365 days
          const TIME_2 = 10800; // 3 hours for files with hash
          const maxAge = /-[a-f0-9]{16}\./.test(fullPath) ? TIME_1 : TIME_2;
          return `public, max-age=${maxAge}`;
        }
      }
    }

    const uploader = client.uploadDir({
      localDir: options.localDir,
      deleteRemoved: true,
      s3Params: {
        Bucket: options.bucket,
        Prefix: options.prefix
      },
      getS3Params(fullPath, _s3Object, callback) {
        callback(null, {
          CacheControl: getFileCacheControl(fullPath)
        });
      }
    });

    uploader.on('error', function (error) {
      reject(error);
    });
    uploader.on('progress', function () {
      progress({ progress: uploader.progressAmount, total: uploader.progressTotal });
    });
    uploader.on('end', function () {
      resolve();
    });
  });
}
