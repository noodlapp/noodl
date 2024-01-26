import { ChatMessageType, ChatSuggestion } from '@noodl-models/AiAssistant/ChatHistory';
import { AiUtils } from '@noodl-models/AiAssistant/context/ai-utils';
import { IAiCopilotContext } from '@noodl-models/AiAssistant/interfaces';
import { extractCodeBlock, wrapInput, wrapOutput } from '@noodl-models/AiAssistant/templates/helper';
import { guid } from '@noodl-utils/utils';

export async function generate(
  { node, chatHistory, chatStream, chatStreamXml }: IAiCopilotContext,
  dbCollectionsSource
) {
  const history = chatHistory.messages.map((x) => ({
    role: String(x.type),
    content: x.content
  }));

  const currentScript = node.getParameter('functionScript');

  // ---
  // Generate code
  const messages = currentScript
    ? [
        // TODO: Enable this again later, ...history.slice(0, -1),
        {
          role: 'system',
          content: FUNCTION_QUERY_DATABASE_CONTEXT_EDIT_GPT3.replace('%{code}%', currentScript).replace(
            '%{database-schema}%',
            dbCollectionsSource
          )
        },
        history.at(-1)
      ]
    : [
        {
          role: 'system',
          content: FUNCTION_QUERY_DATABASE_CONTEXT_GPT3.replace('%{database-schema}%', dbCollectionsSource)
        },
        ...history
      ];

  const fullCodeText = await chatStream({
    provider: {
      model: 'gpt-3.5-turbo',
      temperature: 0.0,
      max_tokens: 2048
    },
    messages,
    onStream(fullText) {
      console.log('code:', fullText);
    }
  });

  const codeText = extractCodeBlock(fullCodeText);

  // ---
  // Evaluate the code if it is valid.

  try {
    // Allow async/await
    const wrappedCode = `async function validateCode() { ${codeText} }`;
    new Function(wrappedCode);
  } catch (error) {
    console.error(error);

    const activityCodeGenId = 'code-generation';
    chatHistory.removeActivity(activityCodeGenId);

    chatHistory.add({
      type: ChatMessageType.Assistant,
      content: ''
    });

    await AiUtils.fakeTokenStream(`I'm sorry. I'm afraid I can't do that.`, (delta, fullText) => {
      chatHistory.updateLast({
        content: fullText
      });
    });

    const activityId = 'processing';
    chatHistory.removeActivity(activityId);

    return;
  }

  // Set the parameter
  node.setParameter('functionScript', codeText);

  // Save it in the history, so it will be possible to go back and forth.
  chatHistory.updateLast({
    metadata: {
      code: codeText
    }
  });

  const activityCodeGenId = 'code-generation';
  chatHistory.removeActivity(activityCodeGenId);

  // ---
  // Explain the code
  chatHistory.add({
    type: ChatMessageType.Assistant,
    content: ''
  });

  let questionIndex = 0;
  const result = [''];

  const fullText = await chatStreamXml({
    messages: [
      {
        role: 'system',
        content: FUNCTION_QUERY_DATABASE_CONTEXT_EXPLAINER
      },
      { role: 'user', content: codeText }
    ],
    provider: {
      model: 'gpt-3.5-turbo',
      temperature: 0.0,
      max_tokens: 2048
    },
    onStream(tagName, text) {
      // TODO: It calls an empty string at the end, why?
      if (text.length === 0) {
        return;
      }

      console.log('stream', tagName, text);

      switch (tagName) {
        case 'explain': {
          result[result.length - 1] = text;
          break;
        }

        case 'Input': {
          result[result.length - 1] = wrapInput(text);
          break;
        }

        case 'Output': {
          result[result.length - 1] = wrapOutput(text);
          break;
        }
      }

      if (['explain', 'Input', 'Output'].includes(tagName)) {
        chatHistory.updateLast({
          content: result.join('')
        });
      }
    },
    onTagOpen(tagName) {
      switch (tagName) {
        case 'Input':
        case 'Output': {
          result.push('');
          break;
        }
      }
    },
    onTagEnd(tagName, fullText) {
      console.log('[done]', tagName, fullText);

      switch (tagName) {
        case 'label': {
          node.setLabel(fullText);
          break;
        }

        case 'explain': {
          result[result.length - 1] = fullText;
          result.push('');
          break;
        }

        case 'Input': {
          result[result.length - 1] = wrapInput(fullText);
          result.push('');
          break;
        }

        case 'Output': {
          result[result.length - 1] = wrapOutput(fullText);
          result.push('');
          break;
        }

        case 'question': {
          const suggestions: ChatSuggestion[] =
            (chatHistory.messages[chatHistory.messages.length - 1].metadata.suggestions as ChatSuggestion[]) || [];
          suggestions[questionIndex] = {
            id: guid(),
            text: fullText.endsWith('?') ? fullText : fullText + '?'
          };

          chatHistory.updateLast({
            metadata: {
              suggestions
            }
          });

          questionIndex++;
          break;
        }
      }

      if (['explain', 'Input', 'Output'].includes(tagName)) {
        chatHistory.updateLast({
          content: result.join('')
        });
      }
    }
  });

  console.log('fullText', fullText);
}

const FUNCTION_QUERY_DATABASE_CONTEXT_GPT3_GENERAL_RULES = `###Instructions###
In Noodl functions, inputs follow "Inputs[InputName]" format and are read-only. Outputs follow "Outputs[OutputName] = value" format, and variables don't store outputs. Signals are sent using "Outputs.SignalName()" without passing values. Inputs and Outputs are global, and const should use Noodl inputs with OR operator and default value. Call "Success" or "Failure" output signals accordingly. Inputs and outputs can have human-readable string names. Functions can use resources from a CDN and access APIs with "fetch." For API handling, make API keys inputs, throw an error for invalid keys, add queries as inputs, and send primitive values to outputs.

###Query API###
query(className, query, options) A async function that queries the database with the provided query parameter, returning the result or throwing an exception upon failure.`;

const FUNCTION_QUERY_DATABASE_CONTEXT_GPT3_GENERAL_BACKGROUND = `###Available Operators###
lessThan: Less Than
lessThanOrEqualTo: Less Than Or Equal To
greaterThan: Greater Than
greaterThanOrEqualTo: Greater Than Or Equal To
equalTo: Not Equal To
notEqualTo: Not Equal To
containedIn: Contained In
notContainedIn: Not Contained in
exists: A value is set for the key
matchesRegex: Check if a value matches a regex pattern
text: Text search in one or several columns using a text index
idEqualTo: Match the id of the item to a specific id
idContainedIn: Check if the id of the item matches an id in an array of ids
pointsTo: Check if the id of the item matches an id in an array of ids
relatedTo: Checks if the item is related to another item, through a relation

###Condition Examples###
{
  Letter: { containedIn: ["A", "B", "C"] },
}

{
  Letter: { exists: true },
}

{
  and: [{ ZipCode: { exists: true } }, { Score: { greaterThan: 10 } }],
}

{
  SomeString: { matchesRegex: "pattern", options: "i" },
}

{
  SomeDate: { equalTo: new Date() },
}

{
  SomeString: { equalTo: Inputs.MyStringInput },
}

{
  SomeString: { text: { search: Inputs.MyStringInput } },
}

{
  SomeString: {
    text: {
      search: {
        term: Inputs.MyStringInput,
        caseSensitive: true,
      },
    },
  },
}

{
  idEqualTo: Inputs.TheRecordId,
}

{
  idContainedIn: [Inputs.FirstObjectId, Inputs.SecondObjectId],
}

{
  Owner: { pointsTo: Inputs.MyPostId },
}

{
  Owner: { pointsTo: [Inputs.MyFirstPostId, Inputs.MySecondPost] },
}

{
  relatedTo: { id: Inputs.MyRecordWithARelation, key: "the-relation-key" },
}

{
  Location: {
    nearSphere: {
      latitude: 48.0,
      longitude: -110.1,
    },
  },
}

{
  Location: {
    nearSphere: {
      latitude: 48.0,
      longitude: -110.1,
      maxDistanceInKilometers: 100,
    },
  },
}

{
  Location: {
    withinBox: [
      {
        latitude: 37.71,
        longitude: -122.53,
      },
      {
        latitude: 30.82,
        longitude: -122.37,
      },
    ],
  },
}

{
  Location: {
    withinPolygon: [
      {
        latitude: 25.774,
        longitude: -80.19,
      },
      {
        latitude: 18.466,
        longitude: -66.118,
      },
      {
        latitude: 32.321,
        longitude: -64.757,
      },
    ],
  },
}

const results = await query(
  "myClass",
  {
    Completed: { equalTo: true },
  },
  {
    sort: ["createdAt"],
  }
);

sort: ["-Age", "createdAt"]

const results = await query(
  "myClass",
  {
    Completed: { equalTo: true },
  },
  {
    sort: ["-createdAt"], // use - to sort descending
    skip: 50,
    limit: 200,
  }
);

const res = await query(
  "myClass",
  {
    Completed: { equalTo: true },
  },
  {
    sort: ["-createdAt"], // use - to sort descending
    skip: 50,
    limit: 200,
    count:true,
  }
);

const results = await query(
  "myClass",
  {},
  {
    include: "Customer",
  }
);

const results = await query(
  "myClass",
  {},
  {
    include: "Customer,Author.Location",
  }
);

const results = await query(
  "myClass",
  {
    Completed: { equalTo: true },
  },
  {
    select: "Title,Body",
  }
);`;

const FUNCTION_QUERY_DATABASE_CONTEXT_GPT3 = `${FUNCTION_QUERY_DATABASE_CONTEXT_GPT3_GENERAL_RULES}

###Query Example###
\`\`\`
const query = Noodl.Records.query;
const articleId = Inputs.ArticleId;
const likesThreshold = Inputs.LikesThreshold || 4;

if (!articleId) return;

try {
const results = await query("Comment", {
article_id: { pointsTo: articleId },
likes: { greaterThan: likesThreshold },
});

Outputs.Articles = results;
Outputs.Success();
} catch (error) {
console.error("Error:", error);
Outputs.Failure();
Outputs.error = error
}
\`\`\`

${FUNCTION_QUERY_DATABASE_CONTEXT_GPT3_GENERAL_BACKGROUND}

###schema###
Here is the schema of the database:
%{database-schema}%

##Task###
Make a query from the given task and return only code.`;

const FUNCTION_QUERY_DATABASE_CONTEXT_EDIT_GPT3 = `${FUNCTION_QUERY_DATABASE_CONTEXT_GPT3_GENERAL_RULES}

${FUNCTION_QUERY_DATABASE_CONTEXT_GPT3_GENERAL_BACKGROUND}

###schema###
Here is the schema of the database:
%{database-schema}%

We are starting from this code and will only modify it:
\`\`\`
%{code}%
\`\`\`

##Task###
Make a query from the given task and return only code.`;

const FUNCTION_QUERY_DATABASE_CONTEXT_EXPLAINER = `###Context###
- This function is specialized in querying records from a database in Noodl
- We are currently inside a Component with this node created, the node have the function inside.
- All the variables from the Inputs object is defined on the node as inputs which can be set via the properties on input connection.
- All the variables on the Outputs object is defined on the node as outputs which can be connected to another node.
###Instructions###
Analyse the function and create a label, an explanation, and some follow-up questions

###Label###
Create a label that summarises what the function does.

###Explanation###
Explain with 2-5 sentences what the function does after the line with the Noodl.Records.query.
- Always include the property names of the Inputs and Outputs objects in the explanation.
- Always format the property names of the Inputs like this: <Input>input name</Input>
- Always format the property names of the Outputs like this: <Output>output name</Output>

###Follow-up questions###
Maximum of 3 follow-up questions related to the code.

###Examples###
<label>Data To Excel</label>
<explain>This function converts a JSON array input called <Input>Data</Input> to an Excel file and initiates a download. It takes a string called  <Input>FileName</Input> as an input, creates a new workbook and worksheet using the XLSX library, converts the JSON data to a sheet, and appends the sheet to the workbook. It then converts the workbook to a binary string, creates a Blob, and generates a download link. Finally, it triggers the <Output>Success</Output> output signal after the download is initiated.</explain>
<question>What is the format of the required JSON data array?</question>
<question>How do I connect this node to other nodes in my Noodl project?</question>
<question>Are there any limitations or required libraries for this function to work properly?</question>

###Task###
Respond only with this specific format, and nothing else:
<label>The label</label>
<explain>The explanation</explain>
<question>The Follow-up questions</question>`;
