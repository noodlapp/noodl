import { GitProgressParser } from './common';

const steps = [{ title: 'Checking out files', weight: 1 }];

/**
 * A class that parses output from `git checkout --progress` and provides
 * structured progress events.
 */
export class CheckoutProgressParser extends GitProgressParser {
  public constructor() {
    super(steps);
  }
}
