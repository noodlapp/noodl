// TODO: Replace all fs here
import fs from 'fs';
import { filesystem, platform } from '@noodl/platform';

import Config from '../../../shared/config/config';

export interface IBugTracker {
  identify(email: string): void;
  track(error: string, data?: TSFixme): void;
  debug(info: string, data?: TSFixme): void;
}

let bugtracker: IBugTracker;

class EmptyBugTracker implements IBugTracker {
  identify(email: string): void {}
  track(error: string, data?: TSFixme): void {}
  debug(info: string, data?: TSFixme): void {}
}

class BugTracker implements IBugTracker {
  constructor() {
    // @ts-expect-error
    console.stdlog = console.log.bind(console);

    console.log = function () {
      bugtracker.debug('Console log', arguments);
      // @ts-expect-error
      console.stdlog.apply(console, arguments);
    };

    if (typeof window !== 'undefined') {
      window.onerror = function (message, file, line, col, error) {
        const text = typeof message === 'string' ? message : message.toString();
        bugtracker.track(text, {
          file: file,
          line: line,
          col: col,
          error: error
        });
        return false;
      };
    }
  }

  identify(email: string) {
    /*  const TrackJS = require('trackjs').TrackJS;
    TrackJS.configure({
        userId: email,
    })*/
  }

  track(error: string, data?: TSFixme) {
    if (!filesystem.exists(logFilePath)) {
      fs.writeFileSync(logFilePath, '');
    }

    //   if(data) TrackJS.console.debug(error,data);
    // TrackJS.track(error);
    fs.appendFileSync(logFilePath, 'Error: ' + error + '\n');
    const err = new Error();
    fs.appendFileSync(logFilePath, 'Stack: ' + err.stack + '\n');
    if (data) {
      const dataStr = JSON.stringify(data, null, 2).slice(0, 10000);
      fs.appendFileSync(logFilePath, dataStr + '\n');
    }
  }

  debug(info: string, data?: TSFixme) {
    if (!filesystem.exists(logFilePath)) {
      fs.writeFileSync(logFilePath, '');
    }

    //       TrackJS.console.debug(info, data);
    fs.appendFileSync(logFilePath, 'Info: ' + info + '\n');
    if (data) {
      try {
        const dataStr = JSON.stringify(data, null, 2).slice(0, 10000);
        fs.appendFileSync(logFilePath, dataStr + '\n');
      } catch (error) {
        // TypeError: Converting circular structure to JSON
        // TODO: How do we want to handle this error?
        console.error(error);
      }
    }
  }
}

function datePathExt(date) {
  return date.toUTCString().replace(/[:\ ,]/g, '-');
}

const logFileDir = filesystem.join(platform.getUserDataPath(), 'debug');
const logFilePath = filesystem.join(logFileDir, `log-${datePathExt(new Date())}.txt`);
filesystem.makeDirectory(logFileDir);

const enabled = !Config.devMode;

bugtracker = enabled ? new BugTracker() : new EmptyBugTracker();

export { bugtracker };
