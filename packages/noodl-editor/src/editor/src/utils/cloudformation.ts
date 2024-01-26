import { CloudService } from '@noodl-models/CloudServices';
import SchemaModel from '@noodl-models/schemamodel';

class FormCollection {
  private cs: TSFixme;
  private template: TSFixme;
  private sm: TSFixme;

  constructor(args: TSFixme) {
    this.cs = args.cs;

    this.template = args.template;
  }

  _formProperties(options: TSFixme) {
    if (this.template.properties === undefined) {
      options.success();
      return;
    }

    this.sm.addSchemaFields({
      collection: this.template.name,
      fields: this.template.properties,
      success: () => {
        if (this.template.data !== undefined) {
          // We have sample data to create
          this._formSampleData(options);
        } else options.success();
      },
      error: (err) => {
        options.error('Failed to create properties for collection ' + this.template.name);
      }
    });
  }

  _formSampleData(options: TSFixme) {
    this.sm.batchCreateObjects({
      collection: this.template.name,
      data: this.template.data,
      success: options.success,
      error: (err: TSFixme) => {
        options.error('Failed to create data collection ' + this.template.name);
      }
    });
  }

  form(options: TSFixme) {
    this.sm = new SchemaModel(this.cs);
    this.sm.getSchema({
      collection: this.template.name,
      success: (schema: TSFixme) => {
        // Schema with this name already exists, verify that all properties
        // are there
        for (const key in this.template.properties) {
          const p = this.template.properties[key];
          const _p = schema.fields[key];
          if (_p !== undefined) {
            if (_p.type === p.type) {
              // Field exists and has matching type, remove from template (no need to create)
              delete this.template.properties[key];
            } else {
              options.error(
                'Property already exists with different type ' + key + ' for collection ' + this.template.name
              );
              return;
            }
          }
        }

        this._formProperties(options);
      },
      error: (res: TSFixme) => {
        if (res.code !== 103) {
          // 103 is class does not exists
          options.error('Failed to create collection ' + this.template.name);
          return;
        }
        // Schema does not exist, create it
        this.sm.createNewSchema({
          collection: this.template.name,
          success: () => {
            this._formProperties(options);
          },
          error: (err: TSFixme) => {
            options.error('Failed to create collection ' + this.template.name);
          }
        });
      }
    });
  }
}

const _types = {
  collection: FormCollection
};

export default class CloudFormation {
  private cs: TSFixme; // TODO: Is this CloudServiceMetadata ? What about masterKey ?

  constructor(args?: TSFixme) {
    if (args) this.cs = args.cs;
  }

  _form(options: TSFixme) {
    const formation = options.template.formation;
    const cs = this.cs;

    function _next() {
      const f = formation.shift();
      if (f === undefined) {
        // We are done
        options.success(cs);
        return;
      }

      const _f = new _types[f.type]({
        template: f,
        cs: {
          endpoint: cs.endpoint || cs.url,
          instanceId: cs.id,
          appId: cs.appId,
          masterKey: cs.masterKey
        }
      });
      _f.form({
        success: () => {
          // Success, move on to next one
          _next();
        },
        error: options.error
      });
    }
    _next();
  }

  _downloadTemplateAndForm(options: TSFixme) {
    if (options.templateUrl !== undefined) {
      const xhr = new XMLHttpRequest();

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          let json;
          try {
            json = JSON.parse(xhr.response);
          } catch (e) {
            /* noop */
          }

          if (xhr.status === 200 || xhr.status === 201) {
            this._form(
              Object.assign(
                {
                  template: json
                },
                options
              )
            );
          } else {
            options.error('Failed to read cloud formation template');
          }
        }
      };

      xhr.open('GET', options.templateUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send();
    } else {
      // No template
      options.success(this.cs);
    }
  }

  _waitForCloudServicesToBeReady(cs: TSFixme, fn: (ready: boolean) => void, retry?: number) {
    if (retry === 5) return fn(false);

    const sm = new SchemaModel(cs);
    sm.getSchema({
      collection: '_User',
      success: () => {
        fn(true);
      },
      error: () => {
        setTimeout(() => this._waitForCloudServicesToBeReady(cs, fn, (retry || 0) + 1), 1000); // Wait a second and try again
      }
    });
  }

  setup(options: {
    templateUrl: string;
    cloudServices: TSFixme;
    success: (cs: TSFixme) => void;
    error: (cs: TSFixme) => void;
  }) {
    // Create new cloud services if needed
    if (options.cloudServices.id === undefined) {
      CloudService.instance.backend.fetch().then((collection) => {
        // TODO(OS): Cloud formation Cloud Service
        // // Make sure we have a unique name for the cloud services
        // const orgName = options.cloudServices.name;
        // let idx = 1;
        // while (collection.find((e) => e.type === EnvironmentType.Noodl && e.name === options.cloudServices.name)) {
        //   options.cloudServices.name = orgName + ` (${idx})`;
        //   idx++;
        // }
        //
        // Create the new environment
        // TODO: Call create method
        // CloudService.instance._workspace
        //   .createEnvironment({
        //     name: options.cloudServices.name,
        //     description: options.cloudServices.desc,
        //     type: EnvironmentType.Noodl
        //   })
        //   .then((created) => {
        //     if (!created.isValid()) {
        //       options.error('Failed to create cloud services');
        //       return;
        //     }
        //
        //     // Wait for cloud services to be ready
        //     this._waitForCloudServicesToBeReady(created, (ready) => {
        //       if (!ready) {
        //         options.error('Failed to create cloud services (2)');
        //         return;
        //       }
        //
        //       this.cs = created; // TODO: What type?
        //       this._downloadTemplateAndForm(options);
        //     });
        //   });
      });
    } else {
      this.cs = options.cloudServices;
      this._downloadTemplateAndForm(options);
    }
  }
}
