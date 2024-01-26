declare module 's3' {
  import { EventEmitter } from 'events';

  type ClientOptions = {
    /** S3 Client */
    s3Client?: TSFixme;
    /** (Or) S3 Client Optionss */
    s3Options?: TSFixme;

    /** Default: 20 */
    maxAsyncS3?: number;

    /** Default: 3 */
    s3RetryCount?: number;

    /** Default: 1000 */
    s3RetryDelay?: number;

    multipartUploadThreshold?: number;
    multipartUploadSize?: number;
    multipartDownloadThreshold?: number;
    multipartDownloadSize?: number;
  };

  type ClientDeleteObjectsParams = {
    Bucket: string;
    Delete: TSFixme;
    MFA: TSFixme;
  };

  type ClientUploadFileParams = {
    Bucket: string;
    s3Params: TSFixme;

    /** Default: 'application/octet-stream' */
    defaultContentType?: string;
  };

  type ClientDownloadFileParams = {
    localFile: string;
    s3Params: TSFixme;
  };

  type ClientListObjectsParams = {
    recursive: boolean;
    s3Params: {
      Bucket: string;
      Delimiter: string;
      Marker: string;
      MaxKeys: number;
      Prefix: string;
    };
  };

  // https://github.com/noodlapp/node-s3-client#clientuploaddirparams
  type ClientSyncDirParams = {
    followSymlinks?: boolean;
    localDir: string;
    deleteRemoved: boolean;
    defaultContentType?: string;
    getS3Params?: (fullPath: string, s3Object: TSFixme, callback: (err: TSFixme, s3Params: TSFixme) => void) => void;
    s3Params: {
      Bucket: string;
      Prefix: string;

      [key: string]: unknown;
    };
  };

  type ClientDeleteDirParams = {
    Bucket: string;
    MFA: TSFixme;
    Prefix: string;
  };

  type UploaderSyncDir = {
    activeTransfers: number;
    progressAmount: number;
    progressTotal: number;
    progressMd5Amount: number;
    progressMd5Total: number;
    objectsFound: number;
    filesFound: number;
    deleteAmount: number;
    deleteTotal: number;
    doneFindingFiles: boolean;
    doneFindingObjects: boolean;
    doneMd5: boolean;
  };

  type UploaderUploadFile = {
    progressAmount: number;
    progressTotal: number;
    progressMd5Amount: number;

    abort(): void;
    getPublicUrl(): TSFixme;
    getPublicUrlHttp(): TSFixme;
  };

  class Client {
    constructor(options?: ClientOptions);

    deleteObjects(params: ClientDeleteObjectsParams): EventEmitter;
    uploadFile(params: ClientUploadFileParams): EventEmitter & UploaderUploadFile;
    downloadFile(params: ClientDownloadFileParams): EventEmitter;
    listObjects(params: ClientListObjectsParams): EventEmitter;
    uploadDir(params: ClientSyncDirParams): EventEmitter & UploaderSyncDir;
    downloadDir(params: ClientSyncDirParams): EventEmitter & UploaderSyncDir;
    deleteDir(params: ClientDeleteDirParams): EventEmitter;
    copyObject(params: TSFixme): EventEmitter;
    moveObject(params: TSFixme): EventEmitter;
    downloadBuffer(params: TSFixme): EventEmitter;
    downloadStream(params: TSFixme): EventEmitter;
  }

  function createClient(options: ClientOptions): Client;
}
