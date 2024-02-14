import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';
import { JSONStorage } from '@noodl/platform';

import { api, cognito } from '@noodl-constants/NeueBackend';
import { Model } from '@noodl-utils/model';

import { NeueSession } from './type';

export class NeueService extends Model {
  public static instance: NeueService = new NeueService();
  private session?: NeueSession;

  constructor() {
    super();
  }

  public login(email: string, password: string) {
    return new Promise<any>((resolve, reject) => {
      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password
      });
      const userPool = new CognitoUserPool({
        UserPoolId: cognito.userPoolId,
        ClientId: cognito.clientId
      });
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });
      this.asyncAuthenticateUser(cognitoUser, authDetails)
        .then((result) => {
          const accessToken = result.getIdToken().getJwtToken();
          this.session = {
            token: accessToken,
            tokenUpdatedAt: Date.now()
          };
          JSONStorage.set('neueSession', this.session);
          resolve(this.session);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  private asyncAuthenticateUser(cognitoUser, cognitoAuthenticationDetails) {
    return new Promise<any>(function (resolve, reject) {
      cognitoUser.authenticateUser(cognitoAuthenticationDetails, {
        onSuccess: resolve,
        onFailure: reject,
        newPasswordRequired: resolve
      });
    });
  }

  public check(): boolean {
    return this.session !== undefined;
  }

  public logout() {
    this.reset();
    this.notifyListeners('signedIn', false);
  }

  private reset() {
    console.log('reset');
    this.session = undefined;
    JSONStorage.remove('neueSession');
  }

  public async load() {
    return new Promise<boolean>((resolve) => {
      JSONStorage.get('neueSession').then((data) => {
        const keys = Object.keys(data);
        if (keys && data.tokenUpdatedAt - Date.now() < cognito.tokenLifetime) {
          this.session = data;
          this.notifyListeners('session', this.session);
        }
        resolve(keys.length > 0);
      });
    });
  }

  public fetchDevices() {
    return new Promise<Array<string>>((resolve) => {
      fetch(api.invokeUrl + '/devices', {
        method: 'GET',
        headers: {
          Authorization: this.session?.token || ''
        }
      }).then((response) => {
        response.json().then((data) => {
          const results = [];
          data.forEach((item) => {
            results.push(item.Data[0].ScalarValue);
          });
          resolve(results);
        });
      });
    });
  }
}
