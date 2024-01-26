import React from 'react';
import Model from '../../../shared/model';

/**
 * Purpose:
 * - Config
 * - Outside of React
 * - Maintain many different instances of the components (multi document with keep-alive)
 */
export interface IDocumentProvider {
  getComponent(): React.ComponentType<any>;
}

export class AppRegistry extends Model {
  public static instance = new AppRegistry();

  private documentProviders: {
    [key: string]: IDocumentProvider;
  } = {};

  private activeDocumentId: string;
  private activeDocument: any;

  public get CurrentDocumentId(): string {
    return this.activeDocumentId;
  }

  public getActiveDocument() {
    return this.activeDocument;
  }

  public registerDocumentProvider(id: string, provider: IDocumentProvider) {
    if (!provider.getComponent) {
      throw new Error('Invalid Document Provider');
    }

    const isReplaced = !!this.documentProviders[id];
    this.documentProviders[id] = provider;

    if (isReplaced && this.activeDocumentId === id) {
      this.activeDocument = provider.getComponent();
      this.notifyListeners('documentChanged');
    }
  }

  public openDocument(id: string, props?: any) {
    const provider = this.documentProviders[id];
    if (provider) {
      this.activeDocumentId = id;
      this.activeDocument = () => React.createElement(provider.getComponent(), props);

      this.notifyListeners('documentChanged');
      return;
    }

    throw new Error('Document Provider not registered.');
  }
}
