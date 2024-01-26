import { useModernModel } from '@noodl-hooks/useModel';
import { OpenAiStore } from '@noodl-store/AiAssistantStore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import { AiAssistantModel } from '@noodl-models/AiAssistant/AiAssistantModel';
import { AiCopilotContext } from '@noodl-models/AiAssistant/AiCopilotContext';
import { ChatHistoryEvent, ChatMessage } from '@noodl-models/AiAssistant/ChatHistory';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { createModel } from '@noodl-utils/CodeEditor';
import { LocalUserIdentity } from '@noodl-utils/LocalUserIdentity';
import { tracker } from '@noodl-utils/tracker';

import { AiChatBox } from '@noodl-core-ui/components/ai/AiChatBox';
import { AiChatboxError } from '@noodl-core-ui/components/ai/AiChatboxError';
import { AiChatLoader } from '@noodl-core-ui/components/ai/AiChatLoader';
import { AiChatMessage } from '@noodl-core-ui/components/ai/AiChatMessage';
import { AiChatSuggestion } from '@noodl-core-ui/components/ai/AiChatSuggestion';
import { ActivityIndicator } from '@noodl-core-ui/components/common/ActivityIndicator';
import { IconName } from '@noodl-core-ui/components/common/Icon';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { TextArea } from '@noodl-core-ui/components/inputs/TextArea';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { Center } from '@noodl-core-ui/components/layout/Center';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { Text, TextType } from '@noodl-core-ui/components/typography/Text';

import { PopupItemType } from '../../../../Clippy/ClippyCommandsMetadata';
import PopupLayer from '../../../../popuplayer';
import { CodeEditor, CodeEditorProps } from '../../CodeEditor/CodeEditor';

export interface AiChatProps {
  model: NodeGraphNode;
  onUpdated?: () => void;
}

export function AiChat({ model, onUpdated }: AiChatProps) {
  const [context, setContext] = useState<AiCopilotContext>(null);
  const [error, setError] = useState<string>(null);
  const [group] = useState({});

  useEffect(() => {
    AiAssistantModel.instance
      .createContext(model)
      .then((context) => {
        setContext(context);
      })
      .catch((error) => {
        setError(error);
      });
  }, []);

  useEffect(() => {
    if (!context) return;

    context.chatHistory.on(
      ChatHistoryEvent.ActivitiesChanged,
      () => {
        onUpdated();
      },
      group
    );

    return () => {
      context.chatHistory.off(group);
    };
  }, [context]);

  if (error) {
    return (
      <AiChatboxError content="Cannot find the chat history for this node. Could it be that the chat history is missing in Version Control? :(" />
    );
  }

  if (!context) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        <Box hasBottomSpacing>
          <ActivityIndicator />
        </Box>
        <Label>Loading Chat History...</Label>
      </div>
    );
  }

  return <AiNodeChat context={context} onUpdated={onUpdated} />;
}

interface AiNodeChatProps {
  context: AiCopilotContext;
  onUpdated?: () => void;
}

// TODO: clean up the typings across all AI fetures
function aiNodeTypeToPopupItemType(type) {
  switch (type) {
    case 'pink':
      return PopupItemType.Custom;
    case 'green':
      return PopupItemType.Data;
    case 'blue':
      return PopupItemType.Visual;
    default:
      return PopupItemType.Custom;
  }
}

function AiNodeChat({ context, onUpdated }: AiNodeChatProps) {
  useModernModel(context.chatHistory);

  const [message, setMessage] = useState('');
  const canSend = context.chatHistory.activities.length === 0;

  function sendMessage(message: string) {
    tracker.track('AI Chat Message', {
      prompt: message,
      templateId: context.template.id,
      templateName: context.template.name,
      messages: context.chatHistory.messages.map((x) => ({
        content: x.content,
        type: x.type
      }))
    });

    context.chatHistory.add({
      content: message,
      metadata: {
        user: LocalUserIdentity.getUserInfo()
      }
    });

    const id = new Date().getTime().toString();

    AiAssistantModel.instance.addActivity({
      id,
      type: aiNodeTypeToPopupItemType(context.template.type),
      title: context.template.name,
      prompt: message,
      node: context.node,
      graph: context.node.owner.owner
    });

    AiAssistantModel.instance
      .send(context)
      .then(() => {
        console.log('done');
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        AiAssistantModel.instance.removeActivity(id);
        onUpdated();
      });
  }

  function handleSubmit() {
    if (!(message && canSend)) return;
    sendMessage(message);
    setMessage('');
  }

  // You should not be able to reactivly update this while having this panel open
  // So it will always re-render when opening the panel, and we get the latest version.
  const version = OpenAiStore.getVersion();
  const prettyVersion = OpenAiStore.getPrettyVersion();

  const activities = context.chatHistory.activities;
  const suggestions = context.chatHistory.suggestions;

  return (
    <AiChatBox
      footer={
        version === 'disabled' ? (
          <Center>
            <Text textType={TextType.Shy}>Noodl AI is currently disabled.</Text>
          </Center>
        ) : (
          <>
            <TextArea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the task you want the function node to do"
              hasBottomSpacing
              isResizeDisabled
              onEnter={handleSubmit}
              UNSAFE_style={{ minHeight: '72px', fontSize: '12px' }}
            />
            <VStack hasSpacing={1}>
              <PrimaryButton
                label="Send Message"
                size={PrimaryButtonSize.Small}
                isGrowing
                isDisabled={!canSend}
                onClick={handleSubmit}
              />
            </VStack>
          </>
        )
      }
    >
      <Box hasXSpacing hasYSpacing>
        <VStack>
          <Center>
            <Label variant={TextType.Shy} hasBottomSpacing={!!prettyVersion}>
              {context.template.name}
            </Label>
          </Center>
          {prettyVersion && (
            <Center>
              <Label variant={TextType.Shy} size={LabelSize.Small}>
                ({prettyVersion})
              </Label>
            </Center>
          )}
        </VStack>
      </Box>

      {context.chatHistory.messages.map((message, index) => (
        <AiMessage key={message.snowflakeId} context={context} message={message} index={index} onUpdated={onUpdated} />
      ))}

      {activities.some((x) => x.id === 'code-generation') && <AiChatLoader />}

      {activities.length === 0 && suggestions.length > 0 && (
        <Box hasYSpacing={2} UNSAFE_style={{ borderTop: '1px solid var(--theme-color-bg-1)' }}>
          {suggestions.map((x) => (
            <AiChatSuggestion
              key={x.id}
              text={x.text}
              onClick={() => {
                sendMessage(x.text);
              }}
            />
          ))}
        </Box>
      )}
    </AiChatBox>
  );
}

interface AiMessageProps {
  context: AiCopilotContext;
  message: ChatMessage;
  index: number;
  onUpdated?: () => void;
}

export function AiMessage({ context, message, index, onUpdated }: AiMessageProps) {
  const isLast = context.chatHistory.messages.length - 1 === index;
  const isFunctionNode = context.template.nodeName === 'JavaScriptFunction';
  const showAffix = isLast && context.chatHistory.activities.length === 0 && isFunctionNode;

  const username = useMemo(() => {
    return (message.metadata?.user as any)?.name || LocalUserIdentity.getUserInfo().name;
  }, [message]);

  return (
    <AiChatMessage
      key={message.snowflakeId}
      user={
        message.type === 'assistant'
          ? {
              role: 'assistant'
            }
          : {
              role: 'user',
              // TODO: Save the sender with the message
              name: username
            }
      }
      content={message.content}
      affix={showAffix && <AiMessageFunctionNodeAffix context={context} onUpdated={onUpdated} />}
    />
  );
}

interface AiMessageFunctionNodeAffixProps {
  context: AiCopilotContext;
  onUpdated?: () => void;
}

function AiMessageFunctionNodeAffix({ context, onUpdated }: AiMessageFunctionNodeAffixProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef(null);

  useEffect(() => {
    return () => {
      if (!editorRef.current) return;
      editorRef.current.model.dispose();
      editorRef.current = null;
    };
  }, []);

  function showEditor() {
    if (editorRef.current !== null) {
      editorRef.current.model.dispose();
      editorRef.current = null;
    }

    const model = createModel(
      {
        // NOTE: Hardcoded for the Function node
        type: 'string',
        value: context.node.getParameter('functionScript'),
        codeeditor: 'javascript'
      },
      context.node
    );

    function save() {
      const newValue = model.getValue();
      context.node.setParameter('functionScript', newValue);

      // Refresh Property Panel
      onUpdated && onUpdated();
    }

    const props: CodeEditorProps = {
      nodeId: context.node.id,
      model: model,
      onSave: save
    };

    const popoutDiv = document.createElement('div');
    ReactDOM.render(React.createElement(CodeEditor, props), popoutDiv);

    const popout = PopupLayer.instance.showPopout({
      content: { el: [popoutDiv] },
      attachTo: $(rootRef.current),
      position: 'right',
      onClose: function () {
        save();
      }
    });

    editorRef.current = {
      model,
      popoutDiv,
      popout
    };
  }

  return (
    <div ref={rootRef}>
      <PrimaryButton
        size={PrimaryButtonSize.Small}
        variant={PrimaryButtonVariant.MutedOnLowBg}
        icon={IconName.ImportSlanted}
        label="Open code editor"
        testId="ai-code-editor"
        isGrowing
        onClick={(ev) => {
          ev.stopPropagation();
          showEditor();
        }}
      />
    </div>
  );
}
