import { ChatMessageType } from '@noodl-models/AiAssistant/ChatHistory';
import { extractDatabaseSchema } from '@noodl-models/AiAssistant/DatabaseSchemaExtractor';
import { AiNodeTemplate, IAiCopilotContext } from '@noodl-models/AiAssistant/interfaces';

export const template: AiNodeTemplate = {
  type: 'green',
  name: 'JavaScriptFunction',
  nodeDisplayName: 'Write Database',
  onMessage: async ({ node, chatHistory, chatStreamXml }: IAiCopilotContext) => {
    const activityId = 'processing';
    const activityCodeGenId = 'code-generation';

    chatHistory.addActivity({
      id: activityId,
      name: 'Processing'
    });

    chatHistory.addActivity({
      id: activityCodeGenId,
      name: 'Generating code...'
    });

    // ---
    // Database
    const dbCollectionsSource = await extractDatabaseSchema();
    console.log('database schema', dbCollectionsSource);

    // Set the parameter
    // node.setParameter('functionScript', codeText);

    // Save it in the history, so it will be possible to go back and forth.
    // chatHistory.updateLast({
    //   metadata: {
    //     code: codeText
    //   }
    // });

    // ---
    // Explain the code
    // const snowflakeId = chatHistory.add({
    //   type: ChatMessageType.Assistant,
    //   content: ''
    // });

    const history = chatHistory.messages.map((x) => ({
      role: String(x.type),
      content: x.content
    }));

    const currentScript = node.getParameter('functionScript');
    const messages = currentScript
      ? [
          // TODO: Enable this again later, ...history.slice(0, -1),
          {
            role: 'system',
            content: FUNCTION_CRUD_CONTEXT_EDIT.replace('%{database-schema}%', dbCollectionsSource).replace(
              '%{code}%',
              currentScript
            )
          },
          history.at(-1)
        ]
      : [
          {
            role: 'system',
            content: FUNCTION_CRUD_CONTEXT.replace('%{database-schema}%', dbCollectionsSource)
          },
          ...history
        ];

    const fullText = await chatStreamXml({
      messages,
      provider: {
        model: 'gpt-4',
        // model: 'gpt-3.5-turbo',
        // The next context doesnt work with GPT-3.5
        temperature: 0.5,
        max_tokens: 2048
      },
      onStream(tagName, text) {
        // TODO: It calls an empty string at the end, why?
        if (text.length === 0) {
          return;
        }

        console.log('[stream]', tagName, text);

        switch (tagName) {
          case 'explain': {
            chatHistory.updateLast({
              content: text
            });
            break;
          }
        }
      },
      onTagOpen(tagName) {
        console.log('[open]', tagName);

        switch (tagName) {
          case 'explain': {
            chatHistory.add({
              type: ChatMessageType.Assistant,
              content: ''
            });
            break;
          }
        }
      },
      onTagEnd(tagName, fullText) {
        console.log('[done]', tagName, fullText);

        switch (tagName) {
          case 'function': {
            const prefix = 'const Records = Noodl.Records;';
            const fullCode = fullText.includes(prefix) ? fullText : prefix + '\n\n' + fullText;

            // Set the parameter
            node.setParameter('functionScript', fullCode);

            // Save it in the history, so it will be possible to go back and forth.
            chatHistory.updateLast({
              metadata: {
                code: fullCode
              }
            });

            chatHistory.removeActivity(activityCodeGenId);
            break;
          }

          case 'explain': {
            chatHistory.updateLast({
              content: fullText
            });
            break;
          }
        }
      }
    });

    console.log('fullText', fullText);

    chatHistory.removeActivity(activityCodeGenId);
    chatHistory.removeActivity(activityId);
  }
};

const FUNCTION_CRUD_CONTEXT = `
With these functions you can read, write and delete records in the cloud database. All functions are async and will throw an exception if they fail.

- An input in a Noodl function must follow the format "Inputs.InputName".
- An input in a Noodl function is only read, never written to.
- An output in a Noodl function must follow the format "Outputs.OutputName = value".
- A variable in a Noodl function never stores an output.
- Sending a signal from a Noodl function must follow the format "Outputs.SignalName()".
- Signals can not be passed values. All output values must be set as a Noodl function output.
- Inputs and Outputs in a Noodl function are global.
- Noodl functions do not use import statements.
- Noodl functions do not use export statements.
- Noodl functions can use recources from a CDN.
- Noodl functions can access API endpoints with "fetch".
- Define constants as Noodl function inputs.
- All const should be using Noodl inputs with an OR operator to a default value.
- When the request is successful call "Success" output signal.
- When something fails in the code the "Failure" output signal.

Examples:
\`\`\`js
const inputName = Inputs.InputName;

// Check if the input has a value, otherwise return
if (!inputName) return;

// Perform the function logic
\`\`\`

Create a new Car record, with price set to 50:
\`\`\`js
const recordId = Inputs.RecordId;
const newPrice = Inputs.NewPrice || 50;

if (!recordId) return;

try {
  const results = await Record.save(recordId, {
    price: newPrice,
  }, { className: "Car" });

  Outputs.Success();
} catch (error) {
  console.error("Error:", error);
  Outputs.Failure();
}
\`\`\`

Records.fetch(objectOrId,options)
Use this function to fetch the latest properties of a specific record from the cloud database. It will return the object / record.

\`\`\`
// If you use the a record ID you must also specify the class
const myRecord = await Records.fetch(myRecordId, {
  className: "myClass",
});

// You can also fetch a record you have previously fetched or received from a
// query, to get the latest properties from the backend
await Records.fetch(myRecord);
\`\`\`

By default fetch will return pointer properties as the string Id of the object pointed to. But you can use the \`include\` option to specify that you want the content of the object to be returned instead.

\`\`\`
// By using include the request will return the pointed to object with all properties instead of
// just the string Id
const res = await Records.fetch(myRecord,{
  include:["Customer","Author"]
});

res.Customer.id // Now Customer is an object and not a string
\`\`\`

Records.save(objectOrId,properties,options)
Use this function to write an existing record to the cloud database. It will attempt to save all properties of the record / object if you don't specify the optional properties argument, if so it will set and save those properties.

\`\`\`
Objects[myRecordId].SomeProperty = "hello";

// If you use the record id to save, you need to specify the classname explicitly
// by specfiying null or undefinded for properties it will save all proporties in
// the record
await Records.save(myRecordId, null, { className: "myClass" });

// Or use the object directly
await Records.save(Objects[myRecordId]);

// Set specified properties and save only those to the backned
await Records.save(myRecord, {
  SomeProperty: "hello",
});
\`\`\`

Records.increment(objectOrId,properties,options)
This function will increment (or decrease) propertis of a certain record saving it to the cloud database in a race condition safe way. That is, normally you would have to first read the current value, modify it and save it to the database. Here you can do it with one operation.

\`\`\`
// Modify the specified numbers in the cloud
await Records.increment(myRecord, {
  Score: 10,
  Life: -1,
});

// Like save, you can use a record Id and class
await Records.increment(myRecordId, { Likes: 1 }, { className: "myClass" });
\`\`\`

Using the options you can also specify access control, this let's you control which users can access a specific record. The access control is specified as below:

\`\`\`
await Records.save(myRecord, null, {
  acl: {
    "*": { read: true, write: false }, // "*" means everyone, this rules gives everyone read access but not write
    "a-user-id": { read: true, write: true }, // give a specific user write access
    "role:a-role-name": { read: true, write: true }, // give a specific role write access
  },
});
\`\`\`

Records.create(className,properties,options)
This function will create a new record in the cloud database and return the object of the newly created record. If it's unsuccessful it will throw an exception.

\`\`\`
const myNewRecord = await Records.create("myClass", {
  SomeProperty: "Hello",
});

console.log(myNewRecord.SomeProperty);
\`\`\`

You can use the \`options\` agrument to specify access control rules as detailed under **Records.save** above.

Records.delete(objectOrId,options)
Use this function to delete an existing record from the cloud database.

\`\`\`
// If you specify the id of a record to be deleted, you must also provide the
// class name in the options
await Records.delete(myRecordId, { className: "myClass" });

// Or use the object directly (provided it was previously fetched or received via a query)
await Records.delete(Objects[myRecordId]);
\`\`\`

Records.addRelation(options)
Use this function to add a relation between two records.

\`\`\`
// You can either specify the Ids and classes directly
await Noodl.Records.addRelation({
  className: "myClass",
  recordId: "owning-record-id",
  key: "the-relation-key-on-the-owning-record",
  targetRecordId: "the-id-of-the-record-to-add-a-relation-to",
  targetClassName: "the-class-of-the-target-record",
});

// Or if you already have two records that have been previously fetched or returned from a
// query
await Records.addRelation({
  record: myRecord,
  key: "relation-key",
  targetRecord: theTargetRecord,
});
\`\`\`

Records.removeRelation(options)
Use this function to remove a relation between two records.

\`\`\`
// You can either specify the Ids and classes directly
await Records.removeRelation({
  className: "myClass",
  recordId: "owning-record-id",
  key: "the-relation-key-on-the-owning-record",
  targetRecordId: "the-id-of-the-record-to-remove-a-relation-to",
  targetClassName: "the-class-of-the-target-record",
});

// Or if you already have two records that have been previously fetched or returned from a
// query
await Records.removeRelation({
  record: myRecord,
  key: "relation-key",
  targetRecord: theTargetRecord,
});
\`\`\`

Here is the schema of the database:
%{database-schema}%

Respond only with this specific format, and nothing else:
<function>output the code</function>
<explain>short description</explain>`;

const FUNCTION_CRUD_CONTEXT_EDIT = `
With these functions you can read, write and delete records in the cloud database. All functions are async and will throw an exception if they fail.

- An input in a Noodl function must follow the format "Inputs.InputName".
- An input in a Noodl function is only read, never written to.
- An output in a Noodl function must follow the format "Outputs.OutputName = value".
- A variable in a Noodl function never stores an output.
- Sending a signal from a Noodl function must follow the format "Outputs.SignalName()".
- Signals can not be passed values. All output values must be set as a Noodl function output.
- Inputs and Outputs in a Noodl function are global.
- Noodl functions do not use import statements.
- Noodl functions do not use export statements.
- Noodl functions can use recources from a CDN.
- Noodl functions can access API endpoints with "fetch".
- Define constants as Noodl function inputs.
- All const should be using Noodl inputs with an OR operator to a default value.
- When the request is successful call "Success" output signal.
- When something fails in the code the "Failure" output signal.

Records.fetch(objectOrId,options)
Use this function to fetch the latest properties of a specific record from the cloud database. It will return the object / record.

\`\`\`
// If you use the a record ID you must also specify the class
const myRecord = await Records.fetch(myRecordId, {
  className: "myClass",
});

// You can also fetch a record you have previously fetched or received from a
// query, to get the latest properties from the backend
await Records.fetch(myRecord);
\`\`\`

By default fetch will return pointer properties as the string Id of the object pointed to. But you can use the \`include\` option to specify that you want the content of the object to be returned instead.

\`\`\`
// By using include the request will return the pointed to object with all properties instead of
// just the string Id
const res = await Records.fetch(myRecord,{
  include:["Customer","Author"]
});

res.Customer.id // Now Customer is an object and not a string
\`\`\`

Records.save(objectOrId,properties,options)
Use this function to write an existing record to the cloud database. It will attempt to save all properties of the record / object if you don't specify the optional properties argument, if so it will set and save those properties.

\`\`\`
Objects[myRecordId].SomeProperty = "hello";

// If you use the record id to save, you need to specify the classname explicitly
// by specfiying null or undefinded for properties it will save all proporties in
// the record
await Records.save(myRecordId, null, { className: "myClass" });

// Or use the object directly
await Records.save(Objects[myRecordId]);

// Set specified properties and save only those to the backned
await Records.save(myRecord, {
  SomeProperty: "hello",
});
\`\`\`

Records.increment(objectOrId,properties,options)
This function will increment (or decrease) propertis of a certain record saving it to the cloud database in a race condition safe way. That is, normally you would have to first read the current value, modify it and save it to the database. Here you can do it with one operation.

\`\`\`
// Modify the specified numbers in the cloud
await Records.increment(myRecord, {
  Score: 10,
  Life: -1,
});

// Like save, you can use a record Id and class
await Records.increment(myRecordId, { Likes: 1 }, { className: "myClass" });
\`\`\`

Using the options you can also specify access control, this let's you control which users can access a specific record. The access control is specified as below:

\`\`\`
await Records.save(myRecord, null, {
  acl: {
    "*": { read: true, write: false }, // "*" means everyone, this rules gives everyone read access but not write
    "a-user-id": { read: true, write: true }, // give a specific user write access
    "role:a-role-name": { read: true, write: true }, // give a specific role write access
  },
});
\`\`\`

Records.create(className,properties,options)
This function will create a new record in the cloud database and return the object of the newly created record. If it's unsuccessful it will throw an exception.

\`\`\`
const myNewRecord = await Records.create("myClass", {
  SomeProperty: "Hello",
});

console.log(myNewRecord.SomeProperty);
\`\`\`

You can use the \`options\` agrument to specify access control rules as detailed under **Records.save** above.

Records.delete(objectOrId,options)
Use this function to delete an existing record from the cloud database.

\`\`\`
// If you specify the id of a record to be deleted, you must also provide the
// class name in the options
await Records.delete(myRecordId, { className: "myClass" });

// Or use the object directly (provided it was previously fetched or received via a query)
await Records.delete(Objects[myRecordId]);
\`\`\`

Records.addRelation(options)
Use this function to add a relation between two records.

\`\`\`
// You can either specify the Ids and classes directly
await Noodl.Records.addRelation({
  className: "myClass",
  recordId: "owning-record-id",
  key: "the-relation-key-on-the-owning-record",
  targetRecordId: "the-id-of-the-record-to-add-a-relation-to",
  targetClassName: "the-class-of-the-target-record",
});

// Or if you already have two records that have been previously fetched or returned from a
// query
await Records.addRelation({
  record: myRecord,
  key: "relation-key",
  targetRecord: theTargetRecord,
});
\`\`\`

Records.removeRelation(options)
Use this function to remove a relation between two records.

\`\`\`
// You can either specify the Ids and classes directly
await Records.removeRelation({
  className: "myClass",
  recordId: "owning-record-id",
  key: "the-relation-key-on-the-owning-record",
  targetRecordId: "the-id-of-the-record-to-remove-a-relation-to",
  targetClassName: "the-class-of-the-target-record",
});

// Or if you already have two records that have been previously fetched or returned from a
// query
await Records.removeRelation({
  record: myRecord,
  key: "relation-key",
  targetRecord: theTargetRecord,
});
\`\`\`

Here is the schema of the database:
%{database-schema}%

We are starting from this code and will only modify it:
\`\`\`
%{code}%
\`\`\`

Respond only with this specific format, and nothing else:
<function>output the code</function>
<explain>short description</explain>`;
