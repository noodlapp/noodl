import { TrampolineCommandHandler } from './trampoline-command';

export type RequestGitAccountFuncReturn = { username: string; password: string };
export type RequestGitAccountFunc = (endpoint: string) => Promise<RequestGitAccountFuncReturn>;

let requestGitAccount: RequestGitAccountFunc | undefined = undefined;

export function setRequestGitAccount(func: RequestGitAccountFunc) {
  clearCredentialsCache();
  requestGitAccount = func;
}

export function clearCredentialsCache() {
  accounts.clear();
}

type AccountCache = RequestGitAccountFuncReturn & { updatedAt: number };
const accounts = new Map<string, AccountCache>();

const ACCOUNT_CACHE_TTL = 5 * 60 * 1000;

export async function fetchAccount(endpoint: string, token: string) {
  const now = Date.now();

  if (accounts.has(endpoint)) {
    const account = accounts.get(endpoint);

    // Check if it has expired
    const expired = account.updatedAt + ACCOUNT_CACHE_TTL < now;
    if (!expired) {
      return account;
    }
  }

  if (!requestGitAccount) {
    throw new Error('Git Authentication is not configured');
  }

  // Fetch the account
  let account;
  try {
    account = await requestGitAccount(endpoint);
  } catch (e) {
    console.log('Failed to get git auth', e);
    return undefined;
  }

  // Create cache entry
  const entry: AccountCache = { ...account, updatedAt: now };
  accounts.set(endpoint, entry);

  return entry;
}

const endpointRegex = /\/\/(\w+@?(.+))'/;

export const askpassTrampolineHandler: TrampolineCommandHandler = async (command) => {
  if (command.parameters.length !== 1) {
    return undefined;
  }

  // Example:
  // "Username for 'https://ngit1.noodlapp.com': "
  // "Password for 'https://a@ngit1.noodlapp.com': "

  const firstParameter = command.parameters[0];
  const askUsername = firstParameter.startsWith('Username');
  const askPassword = firstParameter.startsWith('Password');

  if (askUsername || askPassword) {
    const endpointMatch = firstParameter.match(endpointRegex);
    if (endpointMatch.length !== 3) {
      throw new Error('Unable to read the git endpoint.');
    }

    const endpoint = endpointMatch[1];

    // Fetch the account with
    const account = await fetchAccount(endpoint, command.trampolineToken);
    if (!account) {
      return undefined;
    }

    // Return the username or password based on request
    if (askUsername) {
      return account?.username;
    } else if (askPassword) {
      return account?.password;
    }
  }

  return undefined;
};
