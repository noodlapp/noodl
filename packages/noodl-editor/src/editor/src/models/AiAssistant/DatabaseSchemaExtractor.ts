import SchemaHandler from '@noodl-utils/schemahandler';

export async function extractDatabaseSchema() {
  const schema = SchemaHandler.instance;
  if (typeof schema.haveCloudServices === 'undefined') {
    console.error('Missing database schema');

    try {
      await schema._fetch();
    } catch (error) {
      // lets ignore it then...
      console.error(error);
    }
  }

  const dbCollectionsSource =
    schema.dbCollections
      .map((collection) => {
        let str = `${collection.name}\n`;
        Object.keys(collection.schema.properties).forEach((name) => {
          const property = collection.schema.properties[name];
          switch (property.type) {
            case 'Pointer': {
              str += `- ${name}:Pointer ${property.targetClass}\n`;
              break;
            }

            case 'Relation': {
              str += `- ${name}:Relation ${property.targetClass}\n`;
              break;
            }

            default: {
              str += `- ${name}:${property.type}\n`;
              break;
            }
          }
        });

        return str;
      })
      .join('\n') + '\n';

  return dbCollectionsSource;
}

export async function extractDatabaseSchemaJSON(): Promise<{ name: string; schema: TSFixme }[]> {
  const schema = SchemaHandler.instance;
  if (typeof schema.haveCloudServices === 'undefined') {
    console.error('Missing database schema');

    try {
      await schema._fetch();
    } catch (error) {
      // lets ignore it then...
      console.error(error);
    }
  }

  return Object.keys(schema.dbCollections).map((key) => schema.dbCollections[key]);
}

export function databaseSchemaCompact(schema: TSFixme): { name: string; compact: string }[] {
  return schema.map((x) => ({
    name: x.name,
    compact: Object.keys(x.schema.properties).join(',')
  }));
}
