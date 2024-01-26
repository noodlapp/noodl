import fs from 'fs';
import got from 'got';
import ProgressBar from 'progress';
import mkdirp from 'mkdirp';
import checksum from 'checksum';
import rimraf from 'rimraf';
import tar from 'tar';
import zlib from 'zlib';
import { getGitConfig } from './config-git';
import { gitCleanUp } from './clean-up';

export interface GitDownloadOptions {
  outputPath: string;
  tempFile: string;
  source: string;
  checksum: string;
  platform: string;
  architecture: string;
}

export async function gitSimpleDownload(options: { outputPath: string; platform: string; architecture: string }) {
  console.log('Noodl Build: -- Begin Git');
  console.log('> outputPath: ', options.outputPath);
  console.log('> architecture: ', options.architecture);
  console.log('> platform: ', options.platform);
  console.log('--');

  console.log(`Noodl Build: Create git config...`);
  const config = getGitConfig({
    architecture: options.architecture,
    platform: options.platform
  });

  console.log('> config.checksum: ', config.checksum);
  console.log('> config.fileName: ', config.fileName);
  console.log('> config.source: ', config.source);
  console.log('> config.tempFile: ', config.tempFile);
  console.log('> options.outputPath: ', options.outputPath);

  const targetName = `${options.platform}-${options.architecture}`;
  console.log(`Noodl Build: Download git natives for ${targetName}...`);

  // Download git natives for the targeted platform
  await gitDownload({
    ...config,
    ...options
  });

  console.log(`Noodl Build: Clean up git natives...`);

  // Clean up the git files that we don't need
  gitCleanUp({
    gitDir: options.outputPath,
    architecture: options.architecture
  });

  console.log('Noodl Build: -- End Git');
}

function verifyFile(file: string, matchChecksum: string) {
  return new Promise<boolean>((resolve) => {
    checksum.file(file, { algorithm: 'sha256' }, async (_, hash) => {
      const match = hash === matchChecksum;

      if (!match) {
        console.log(`Validation failed. Expected '${matchChecksum}' but got '${hash}'`);
      }

      resolve(match);
    });
  });
}

function download(config: GitDownloadOptions) {
  return new Promise<void>((resolve, reject) => {
    console.log(`Downloading Git from: ${config.source}`);

    const options = {
      headers: {
        Accept: 'application/octet-stream',
        'User-Agent': 'dugite'
      },
      secureProtocol: 'TLSv1_2_method'
    };

    const client = got.stream(config.source, options);

    client.pipe(fs.createWriteStream(config.tempFile));

    client.on('error', function (error) {
      // @ts-ignore Property 'code' does not exist on type 'Error'.
      if (error?.code === 'ETIMEDOUT') {
        console.log(
          `A timeout has occurred while downloading '${config.source}' - check ` +
            `your internet connection and try again. If you are using a proxy, ` +
            `make sure that the HTTP_PROXY and HTTPS_PROXY environment variables are set.`,
          error
        );
      } else {
        console.log(`Error raised while downloading ${config.source}`, error);
      }
      reject(error);
    });

    client.on('response', function (res) {
      if (res.statusCode !== 200) {
        console.log(`Non-200 response returned from ${config.source} - (${res.statusCode})`);
        reject(`Non-200 response returned from ${config.source} - (${res.statusCode})`);
      }

      const len = parseInt(res.headers['content-length'], 10);

      console.log();
      const bar = new ProgressBar('Downloading Git [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 50,
        total: len
      });

      res.on('data', function (chunk) {
        bar.tick(chunk.length);
      });

      res.on('end', function () {
        resolve();
      });
    });
  });
}

function unpackFile(file: fs.PathLike, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    function extract(source: fs.PathLike, callback: (err?: Error) => void) {
      const extractor = tar
        .extract({ cwd: outputPath })
        .on('error', function (error: Error) {
          callback(error);
        })
        .on('end', function () {
          callback();
        });

      fs.createReadStream(source)
        .on('error', function (error) {
          callback(error);
        })
        // @ts-expect-error
        .pipe(zlib.Gunzip())
        .pipe(extractor);
    }

    console.log('Extracting file... (', file, ')');
    extract(file, function (error) {
      if (error) {
        console.log('Unable to extract archive, aborting...', error);
        return reject('Unable to extract archive, aborting... ' + error);
      }

      console.log('Done extracting file.');
      resolve();
    });
  });
}

async function downloadAndUnpack(config: GitDownloadOptions) {
  await download(config);

  const valid = await verifyFile(config.tempFile, config.checksum);
  if (valid) {
    await unpackFile(config.tempFile, config.outputPath);
  } else {
    console.log(`checksum verification failed, refusing to unpack...`);
    throw `checksum verification failed, refusing to unpack...`;
  }
}

function mkdirpAsync(dir: string) {
  return new Promise<void>((resolve, reject) => {
    mkdirp(dir, function (error) {
      if (error) {
        return reject(error);
      }

      resolve();
    });
  });
}

export async function gitDownload(config: GitDownloadOptions) {
  if (config.source === '') {
    console.log(`Skipping downloading embedded Git as platform '${config.platform}' is not supported.`);
    console.log(`To learn more about using dugite with a system Git: https://git.io/vF5oj`);
    throw `Skipping downloading embedded Git as platform '${config.platform}' is not supported.`;
  }

  if (fs.existsSync(config.outputPath)) {
    try {
      console.log("Delete all old git files...")
      rimraf.sync(config.outputPath);
    } catch (err) {
      console.error(err);
    }
  }

  await mkdirpAsync(config.outputPath);

  if (fs.existsSync(config.tempFile)) {
    const valid = await verifyFile(config.tempFile, config.checksum);
    if (valid) {
      await unpackFile(config.tempFile, config.outputPath);
    } else {
      rimraf.sync(config.tempFile);
      await downloadAndUnpack(config);
    }
  } else {
    await downloadAndUnpack(config);
  }
}
