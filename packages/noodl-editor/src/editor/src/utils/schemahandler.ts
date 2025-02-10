import { CloudService } from '@noodl-models/CloudServices';
import { ProjectModel } from '@noodl-models/projectmodel';
import { getCloudServices, setCloudServices } from '@noodl-models/projectmodel.editor';
import SchemaModel from '@noodl-models/schemamodel';

import { EventDispatcher } from '../../../shared/utils/EventDispatcher';

export default class SchemaHandler {
  public static instance: SchemaHandler | undefined;

  public haveCloudServices: boolean;
  public schemaModel: SchemaModel | undefined;
  public dbCollections: TSFixme[];
  public systemCollections: TSFixme[];
  public configSchema: TSFixme;
  public parseServerVersion: string;

  constructor() {
    EventDispatcher.instance.on(
      ['window-focused', 'Model.cloudServicesChanged'],
      () => {
        if (ProjectModel.instance) {
          this._fetch();
        }
      },
      this
    );
  }

  dispose() {
    EventDispatcher.instance.off(this);
  }

  _fetch() {
    return new Promise<void>((resolve) => {
      this.dbCollections = [];

      const activeBroker = getCloudServices(ProjectModel.instance);
      if (!activeBroker || activeBroker.id === undefined) {
        this.haveCloudServices = false;
        this._store();
        return; // No project broker
      }

      CloudService.instance.backend.fetch().then((collection) => {
        // Find by the Url / Endpoint and app id
        let environment = collection.find((b) => {
          return b.url === activeBroker.endpoint && b.appId === activeBroker.appId;
        });

        // Backwards compatibility:
        //    Make sure that the URL is the same as the one in the database.
        if (!environment) {
          // Find by the ID
          environment = collection.find((b) => b.id === activeBroker.id);

          // Update the stored cloud service
          if (environment) {
            setCloudServices(ProjectModel.instance, {
              id: environment.id,
              endpoint: environment.url,
              appId: environment.appId
            });
          }
        }

        this.haveCloudServices = environment !== undefined;
        if (environment === undefined) {
          this._store();
          return;
        }

        const opts = {
          endpoint: environment.url,
          instanceId: environment.id,
          masterKey: environment.masterKey,
          appId: environment.appId
        };
        this.schemaModel = new SchemaModel(opts);

        const ignoreCollections = ['Ndl_CF']; // Ignore the Ndl_CF collection, containing cloud function deploys

        this.schemaModel.listSchemas({
          success: (schemas: TSFixme) => {
            this.dbCollections = schemas
              .filter((r: TSFixme) => r.name[0] !== '_' && ignoreCollections.indexOf(r.name) == -1)
              .map((schema: TSFixme) => {
                return {
                  name: schema.name,
                  schema: {
                    properties: schema.fields
                  }
                };
              });

            this.systemCollections = schemas
              .filter((r: TSFixme) => r.name[0] === '_' && ignoreCollections.indexOf(r.name) == -1)
              .map((schema: TSFixme) => {
                return {
                  name: schema.name,
                  schema: {
                    properties: schema.fields
                  }
                };
              });

            // Get the config schema
            this.schemaModel.getConfigSchema({
              success: (configSchema) => {
                this.configSchema = configSchema;
                this._store();
                resolve();
              },
              error: (e) => {
                console.log(e);
              }
            });
          },
          error: (e: TSFixme) => {
            console.log(e);
          }
        });

        // Get Parse Server Version & Supported features
        fetch(environment.url + '/serverInfo', {
          method: 'POST',
          body: JSON.stringify({
            "_method": "GET",
            "_ApplicationId": environment.appId,
            "_MasterKey": environment.masterKey,
          })
        })
          .then((response) => response.json())
          .then((json) => {
            this.parseServerVersion = json.parseServerVersion;
          });
      });
    });
  }

  _store() {
    if (ProjectModel.instance) {
      if (this.haveCloudServices) {
        ProjectModel.instance.setMetaData('dbCollections', this.dbCollections);
        ProjectModel.instance.setMetaData('systemCollections', this.systemCollections);
        ProjectModel.instance.setMetaData('dbConfigSchema', this.configSchema);

        const versionNumbers = this.parseServerVersion?.split(".")
        if (versionNumbers && versionNumbers.length > 0) {
          // Let's only save the major version number,
          // since this will be used to determine which verison of the API to use.
          ProjectModel.instance.setMetaData('dbVersionMajor', versionNumbers[0]);
        } else {
          ProjectModel.instance.setMetaData('dbVersionMajor', undefined);
        }
      } else {
        ProjectModel.instance.setMetaData('dbCollections', undefined);
        ProjectModel.instance.setMetaData('systemCollections', undefined);
        ProjectModel.instance.setMetaData('dbConfigSchema', undefined);
        ProjectModel.instance.setMetaData('dbVersionMajor', undefined);
      }
    }
  }
}
