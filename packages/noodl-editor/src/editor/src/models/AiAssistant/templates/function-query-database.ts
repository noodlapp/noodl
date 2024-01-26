import { OpenAiStore } from '@noodl-store/AiAssistantStore';

import { extractDatabaseSchema } from '@noodl-models/AiAssistant/DatabaseSchemaExtractor';
import { AiNodeTemplate } from '@noodl-models/AiAssistant/interfaces';
import * as QueryGPT4 from '@noodl-models/AiAssistant/templates/function-query-database/gpt-4-version';
import * as QueryGPT3 from '@noodl-models/AiAssistant/templates/function-query-database/gpt-4-version';

export const template: AiNodeTemplate = {
  type: 'green',
  name: 'JavaScriptFunction',
  nodeDisplayName: 'Read Database',
  onMessage: async (context) => {
    const version = OpenAiStore.getVersion();

    const activityId = 'processing';
    const activityCodeGenId = 'code-generation';

    context.chatHistory.addActivity({
      id: activityId,
      name: 'Processing'
    });

    context.chatHistory.addActivity({
      id: activityCodeGenId,
      name: 'Generating code...'
    });

    // ---
    // Database
    const dbCollectionsSource = await extractDatabaseSchema();
    console.log('database schema', dbCollectionsSource);

    // ---
    console.log('using version: ', version);

    if (['full-beta', 'enterprise'].includes(version)) {
      await QueryGPT4.execute(context, dbCollectionsSource);
    } else {
      await QueryGPT3.execute(context, dbCollectionsSource);
    }

    context.chatHistory.removeActivity(activityCodeGenId);
    context.chatHistory.removeActivity(activityId);
  }
};
