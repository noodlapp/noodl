import { useNodeGraphContext } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';
import { useModernModel } from '@noodl-hooks/useModel';
import { OpenAiStore } from '@noodl-store/AiAssistantStore';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { FeedbackType } from '@noodl-constants/FeedbackType';
import { AiAssistantModel } from '@noodl-models/AiAssistant';
import { verifyOpenAiApiKey } from '@noodl-models/AiAssistant/api';
import { SidebarModel } from '@noodl-models/sidebar';
import getDocsEndpoint from '@noodl-utils/getDocsEndpoint';
import { LocalUserIdentity } from '@noodl-utils/LocalUserIdentity';
import { tracker } from '@noodl-utils/tracker';

import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';
import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { TextInput, TextInputVariant } from '@noodl-core-ui/components/inputs/TextInput';
import { DialogRenderDirection } from '@noodl-core-ui/components/layout/BaseDialog';
import { Portal } from '@noodl-core-ui/components/layout/Portal';
import { Tooltip } from '@noodl-core-ui/components/popups/Tooltip';
import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { Text, TextSize, TextType } from '@noodl-core-ui/components/typography/Text';
import { Title } from '@noodl-core-ui/components/typography/Title';
import { UserBadge, UserBadgeSize } from '@noodl-core-ui/components/user/UserBadge';

import { ToastLayer } from '../ToastLayer/ToastLayer';
import css from './Clippy.module.scss';
import {
  PopupItemType,
  promptToNodeCommands,
  copilotNodeCommands,
  comingSoonCommands,
  copilotNodeInstaPromptable
} from './ClippyCommandsMetadata';
import { ClippyLogo } from './components/ClippyLogo/ClippyLogo';
import GrowingTextArea from './components/GrowingTextArea/GrowingTextArea';
import { CommandResultItem, handleCommand } from './HackyClippyBackend';

export default function Clippy() {
  const [firstInputValue, setFirstInputValue] = useState('');
  const [secondInputValue, setSecondInputValue] = useState('');
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedPromptTitle, setSelectedPromptTitle] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiThinkingStatus, setAIThinkingStatus] = useState('');
  const [shouldFirstInputAutofocus, setShouldFirstInputAutofocus] = useState(false);
  const [isTextareaInsteadOfInput, setIsTextareaInsteadOfInput] = useState(false);
  const [commandResultItems, setCommandResultItems] = useState<CommandResultItem[]>(null); //commands might generate follow-up items
  const [hasGPT4, setHasGPT4] = useState(false);
  const firstInputRef = useRef(null);
  const secondInputRef = useRef(null);
  const secondTextAreaRef = useRef(null);
  const ref = useRef<HTMLDivElement>();
  const [hasApiKey, setHasApiKey] = useState(false);
  const aiAssistantModel = useModernModel(AiAssistantModel.instance);
  const nodeGraphContext = useNodeGraphContext();

  const version = OpenAiStore.getVersion();

  const isFrontend = nodeGraphContext.active === 'frontend';
  const commandFilter = (x) =>
    ((x.availableOnFrontend && isFrontend) || (x.availableOnBackend && !isFrontend)) &&
    (!x.requireGPT4 || (x.requireGPT4 && hasGPT4));

  const promptToNode = promptToNodeCommands.filter(commandFilter);
  const copilotNodes = copilotNodeCommands.filter(commandFilter);
  const comingSoonItems = comingSoonCommands.filter(commandFilter);
  const disabledDueToGpt3Items = promptToNodeCommands
    .concat(copilotNodeCommands)
    .concat(comingSoonCommands)
    .filter((x) => x.requireGPT4 && !hasGPT4);

  const ALL_OPTIONS = [...promptToNode, ...copilotNodes];

  const user = LocalUserIdentity.getUserInfo();

  useEffect(() => {
    const version = OpenAiStore.getVersion();
    if (version === 'enterprise') {
      setHasApiKey(true);
      setHasGPT4(OpenAiStore.getModel() === 'gpt-4');
    } else if (version === 'full-beta') {
      setHasApiKey(OpenAiStore.getIsAiApiKeyVerified());
    } else {
      setHasGPT4(false);
      setHasApiKey(false);
    }
  }, [isInputOpen]);

  useEffect(() => {
    if (!hasApiKey) return;

    async function doIt() {
      const version = OpenAiStore.getVersion();
      if (version === 'enterprise') {
        setHasGPT4(OpenAiStore.getModel() === 'gpt-4');
      } else {
        const models = await verifyOpenAiApiKey(OpenAiStore.getApiKey());
        setHasGPT4(!!models['gpt-4']);
      }
    }

    doIt();
  }, [hasApiKey]);

  //check for clicks outside clippy, which should close it if it's open and not thinking
  useEffect(() => {
    if (!isInputOpen || isAiThinking) return;

    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsInputOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, isInputOpen, isAiThinking]);

  //reset everything when the close animation is done
  useEffect(() => {
    if (isInputOpen) return;

    const speed = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--speed-quick'));

    const id = setTimeout(() => closeAndResetInput(), speed);
    return () => clearTimeout(id);
  }, [isInputOpen]);

  useEffect(() => {
    const split = firstInputValue.split(' ');
    if (split.length <= 1 || split[0][0] !== '/') return;

    const highlightedOption = ALL_OPTIONS.find(
      (item) => item.title.toLowerCase().indexOf(split[0].toLowerCase()) !== -1
    );

    if (highlightedOption) {
      setSelectedPromptTitle(highlightedOption.title);
    }
  }, [firstInputValue, ALL_OPTIONS]);

  const closeAndResetInput = useCallback(() => {
    setIsInputOpen(false);
    setFirstInputValue('');
    setSecondInputValue('');
    setIsInputFocused(false);
    setSelectedPromptTitle(null);
    setIsAiThinking(false);
    setShouldFirstInputAutofocus(false);
    setCommandResultItems(null);
  }, []);

  const restartInput = useCallback(() => {
    setFirstInputValue('');
    setSecondInputValue('');
    setSelectedPromptTitle(null);
    setTimeout(() => {
      firstInputRef.current.focus();
    }, 100);
  }, []);

  const portalRoot = document.querySelector('.clippy-layer');

  if (!portalRoot) return null;

  const highlightedOption =
    firstInputValue?.charAt(0) === '/'
      ? ALL_OPTIONS.find((item) => item.title.toLowerCase().indexOf(firstInputValue.toLowerCase()) !== -1)
      : null;

  const isRegularChat = false; // bring this back later: firstInputValue && firstInputValue.charAt(0) !== '/';

  const selectedOption = selectedPromptTitle ? ALL_OPTIONS.find((item) => item.title === selectedPromptTitle) : null;

  async function runCommand() {
    const id = new Date().getTime().toString();
    closeAndResetInput();

    try {
      const command = selectedOption?.title.toLowerCase();
      const prompt = secondInputValue;
      tracker.track('AI Command', {
        command,
        prompt
      });

      aiAssistantModel.addActivity({
        id,
        type: selectedOption.type,
        title: selectedOption.title,
        prompt,
        graph: nodeGraphContext.nodeGraph.activeComponent
      });

      setAIThinkingStatus('Give me a second...');
      const res = await handleCommand(command, prompt, { nodeGraph: nodeGraphContext.nodeGraph }, (status) =>
        setAIThinkingStatus(status)
      );
      if (res) {
        setCommandResultItems(res);
      }
    } catch (e) {
      console.log(e);
      ToastLayer.showError(e.toString());
    }

    aiAssistantModel.removeActivity(id);
  }

  const initialPlaceholder = isInputOpen ? 'Select (or type) a command below' : 'Ask Noodl AI';
  const isPromptInWrongOrder = Boolean(!selectedOption) && Boolean(secondInputValue);
  const isFullBeta = ['full-beta', 'enterprise'].includes(version);
  const isLimitedBeta = false; // TODO: version === 'limited-beta';

  let isCommandsEnabled = isLimitedBeta;
  if (version === 'enterprise') {
    isCommandsEnabled = true;
  } else if (isFullBeta) {
    if (!hasGPT4 || !hasApiKey) {
      isCommandsEnabled = false;
    } else {
      isCommandsEnabled = true;
    }
  }

  let versionLabel = '';
  if (version === 'enterprise') {
    versionLabel = `Enterprise (${OpenAiStore.getModel()})`;
  } else if (isLimitedBeta) {
    versionLabel = 'Limited Beta (gpt-3)';
  } else if (isFullBeta && hasApiKey && hasGPT4) {
    versionLabel = 'Full beta (gpt-4)';
  }

  return (
    <Portal portalRoot={portalRoot}>
      <div ref={ref} className={css.Root}>
        <div
          className={classNames(
            css.ClippyContainer,
            isInputFocused && css.__isFocused,
            isAiThinking && css.__isThinking
          )}
          onClick={() => {
            if (!isInputOpen) {
              setShouldFirstInputAutofocus(false);
              setIsInputOpen(true);
            }
          }}
        >
          <div className={css.ClippyContent}>
            <div className={classNames(css.IconContainer, isInputOpen && css.__isOpen)}>
              <div className={classNames(css.ClippyIcon, isRegularChat && css.__isHidden)}>
                <ClippyLogo isListening={isInputFocused} isDimmed={!isInputOpen} isThinking={isAiThinking} />
              </div>

              <div className={classNames(css.UserBadge, !isRegularChat && css.__isHidden)}>
                {user && <UserBadge size={UserBadgeSize.Medium} name={user.name} email={user.email} id={user.id} />}
              </div>
            </div>

            <div className={classNames(css.InputContainer, isInputOpen && css.__isOpen)}>
              <div className={css.InputWrapper}>
                {Boolean(selectedOption) && (
                  <PromptTag
                    title={selectedOption.tag}
                    type={selectedOption.type}
                    onRemoveClick={() => {
                      restartInput();
                    }}
                  />
                )}

                {!selectedOption && (
                  <TextInput
                    variant={TextInputVariant.Transparent}
                    value={firstInputValue}
                    placeholder={!isPromptInWrongOrder ? initialPlaceholder : secondInputValue}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onChange={(e) => setFirstInputValue(e.currentTarget.value)}
                    isAutoFocus={shouldFirstInputAutofocus}
                    forwardedInputRef={firstInputRef}
                    onKeyDown={(e) => {
                      if (!isCommandsEnabled) return;
                      switch (e.key) {
                        case 'Escape':
                          closeAndResetInput();
                          return;
                      }
                    }}
                    onEnter={() => {
                      if (!isCommandsEnabled) return;

                      if (firstInputValue.charAt(0) === '/') {
                        setSelectedPromptTitle(highlightedOption.title);
                      } else {
                        const value = firstInputValue;
                        setSecondInputValue(value);
                        setFirstInputValue('');
                      }
                    }}
                  />
                )}

                {Boolean(selectedOption) && (
                  <TextInput
                    UNSAFE_className={classNames(isTextareaInsteadOfInput && css.__isHiddenInput)}
                    variant={TextInputVariant.Transparent}
                    value={secondInputValue}
                    placeholder={selectedOption.placeholder}
                    isAutoFocus={true}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onChange={(e) => setSecondInputValue(e.currentTarget.value)}
                    onScrollbarCreated={() => setIsTextareaInsteadOfInput(true)}
                    onScrollbarRemoved={() => {
                      setIsTextareaInsteadOfInput(false);
                      secondInputRef.current.focus();
                    }}
                    forwardedInputRef={secondInputRef}
                    onKeyDown={(e) => {
                      switch (e.key) {
                        case 'Backspace':
                          if (secondInputValue === '') {
                            restartInput();
                          }
                          return;
                        case 'Escape':
                          closeAndResetInput();
                          return;
                      }
                    }}
                    onEnter={runCommand}
                  />
                )}

                <div
                  className={css.SendIcon}
                  style={{ pointerEvents: isCommandsEnabled ? 'all' : 'none' }}
                  onClick={async () => {
                    if (!selectedOption) {
                      firstInputRef.current.focus();
                      setSelectedPromptTitle(highlightedOption.title);
                    }

                    if (selectedOption) {
                      secondInputRef.current.focus();
                      await runCommand();
                    }
                  }}
                >
                  <SendIcon />
                </div>

                <div className={classNames(css.ThinkingOverlay, isAiThinking && css.__isVisible)}>
                  <Label size={LabelSize.Medium}>{aiThinkingStatus}</Label>
                </div>
              </div>
              {Boolean(selectedOption) && isTextareaInsteadOfInput && isInputOpen && (
                <div className={css.TextArea}>
                  <GrowingTextArea
                    value={secondInputValue}
                    onChange={(e) => {
                      setSecondInputValue(e.currentTarget.value);
                      if (e.currentTarget.value === '') {
                        setIsTextareaInsteadOfInput(false);
                        secondInputRef.current.focus();
                      }
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    forwardedTextAreaRef={secondTextAreaRef}
                    isAutoFocus={true}
                    onKeyDown={(e) => {
                      switch (e.key) {
                        case 'Enter':
                          e.shiftKey && runCommand();
                          return;

                        case 'Escape':
                          closeAndResetInput();
                          return;
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={css.UglySpacingHackPleaseLookAway} />

        <div className={classNames(css.ClippyPopup, isInputOpen && !isAiThinking && css.__isVisible)}>
          {isFullBeta && !isCommandsEnabled && (
            <div className={css.ClippyNoApiKey}>
              <Title hasBottomSpacing>Add your OpenAI API key</Title>
              <Text hasBottomSpacing>You need a GPT-4 API key to access the full beta features.</Text>
              <Text>
                1. Get your API key from your{' '}
                <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noreferrer">
                  OpenAI account
                </a>
              </Text>
              <Text>2. Make sure GPT-4 is enabled for your account</Text>
              <Text>3. Paste the key into the AI section in the Editor Settings panel</Text>
              <Text hasBottomSpacing>4. Click the "Verify API Key" button</Text>

              <Text hasBottomSpacing>
                If you dont have an API key with GPT-4 access, you can set the Noodl AI to use the Limited Beta in the
                editor settings.
              </Text>
              <PrimaryButton
                size={PrimaryButtonSize.Small}
                variant={PrimaryButtonVariant.MutedOnLowBg}
                onClick={() => SidebarModel.instance.switch('editor-settings')}
                label="Open editor settings"
              />
            </div>
          )}

          {isCommandsEnabled && !selectedPromptTitle && !isRegularChat && (
            <>
              {isPromptInWrongOrder && (
                <Label UNSAFE_style={{ padding: 12, marginTop: 2 }} size={LabelSize.Big} variant={FeedbackType.Danger}>
                  The AI needs some context. Please select one below.
                </Label>
              )}

              {Boolean(copilotNodes.length) && (
                <>
                  <SectionTitle title="Copilot nodes" />
                  {copilotNodes.map((item, i) => (
                    <PromptTagSuggestion
                      title={item.title}
                      description={item.description}
                      type={item.type}
                      icon={item.icon}
                      key={item.title}
                      isHighlighted={highlightedOption ? highlightedOption.title === item.title : false}
                      onClick={() => {
                        if (copilotNodeInstaPromptable.includes(item.title.toLowerCase())) {
                          setSelectedPromptTitle(item.title);
                          setSecondInputValue(firstInputValue);
                        } else {
                          const panAndScale = nodeGraphContext.nodeGraph.getPanAndScale();

                          const x = Math.round(Math.random() * 100 + 50);
                          const y = Math.round(Math.random() * 100 + 50);

                          const scaledPos = {
                            x: x / panAndScale.scale - panAndScale.x,
                            y: y / panAndScale.scale - panAndScale.y
                          };

                          AiAssistantModel.instance.createNode(item.templateId, null, scaledPos);

                          setIsInputOpen(false);
                        }
                      }}
                    />
                  ))}
                </>
              )}

              {Boolean(promptToNode.length) && (
                <>
                  <SectionTitle title="Experimental features" />
                  {promptToNode.map((item, i) => (
                    <PromptTagSuggestion
                      title={item.title}
                      description={item.description}
                      type={item.type}
                      icon={item.icon}
                      key={item.title}
                      isHighlighted={highlightedOption ? highlightedOption.title === item.title : false}
                      onClick={() => setSelectedPromptTitle(item.title)}
                    />
                  ))}
                </>
              )}

              {Boolean(disabledDueToGpt3Items.length) && (
                <>
                  <SectionTitle title="Requires a key with GPT4 support" />
                  {disabledDueToGpt3Items.map((item, i) => (
                    <PromptTagSuggestion
                      isDisabled={true}
                      title={item.title}
                      description={item.description}
                      type={item.type}
                      icon={item.icon}
                      key={item.title}
                    />
                  ))}
                </>
              )}

              {Boolean(comingSoonItems.length) && (
                <>
                  <SectionTitle title="Coming soon" />
                  {comingSoonItems.map((item, i) => (
                    <PromptTagSuggestion
                      isDisabled={true}
                      title={item.title}
                      description={item.description}
                      type={item.type}
                      icon={item.icon}
                      key={item.title}
                    />
                  ))}
                </>
              )}

              {Boolean(aiAssistantModel.activities.length) && (
                <>
                  <SectionTitle title="Processing" />
                  {aiAssistantModel.activities.map((activity) => (
                    <PromptTagSuggestion
                      title={activity.title}
                      description={activity.prompt}
                      icon="AI"
                      type={activity.type}
                      key={activity.id}
                      isDisabled={!activity.graph}
                      onClick={() => {
                        if (!activity.graph) return;
                        nodeGraphContext.switchToComponent(activity.graph, {
                          node: activity?.node || undefined,
                          pushHistory: true
                        });
                      }}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {isRegularChat && (
            <>
              <SectionTitle title="Chat history" />
              <div className={css.AiChatItem}>
                <div className={css.IconContainer}>
                  <ClippyLogo isListening />
                </div>
                <Label>How can I help you?</Label>
              </div>
            </>
          )}

          {Boolean(selectedPromptTitle) && selectedOption.examples && !commandResultItems && (
            <>
              <SectionTitle title="Example prompts" />
              {selectedOption.examples.map((item, i) => (
                <ExamplePrompt
                  prompt={item}
                  onClick={() => {
                    setSecondInputValue(item);
                    secondInputRef.current.focus();
                  }}
                  key={item}
                />
              ))}
            </>
          )}

          {Boolean(commandResultItems) && (
            <>
              <SectionTitle title="Example prompts" />
              {commandResultItems.map((item, i) => (
                <PromptTagSuggestion
                  title={item.name}
                  description={item.description}
                  type={PopupItemType.Visual}
                  icon={IconName.UI}
                  key={i}
                  onClick={() => {
                    setSelectedPromptTitle('/' + item.name);
                    setSecondInputValue(item.prompt);
                    setCommandResultItems(null);
                  }}
                />
              ))}
            </>
          )}

          {!isFullBeta && (
            <div className={css.LimitedBetaCard}>
              <Label size={LabelSize.Medium} variant={TextType.Proud} hasBottomSpacing>
                Limited beta
              </Label>

              <Text hasBottomSpacing size={TextSize.Medium}>
                You are running the limited beta of Noodl AI. If features fewer commands and a less capable AI. Get full
                beta access by bringing your own GPT-4 API key.
              </Text>

              <PrimaryButton
                size={PrimaryButtonSize.Small}
                variant={PrimaryButtonVariant.Muted}
                label="Full beta setup instructions"
                href={getDocsEndpoint() + '/docs/getting-started/noodl-ai#full-beta'}
              />
            </div>
          )}

          {versionLabel && (
            <div className={css.GptVersionDisplay}>
              <Label size={LabelSize.Small} variant={TextType.Shy}>
                {versionLabel}
              </Label>
            </div>
          )}
        </div>
        <div className={css.CurrentActivities}>
          {aiAssistantModel.activities.map((activity) => (
            <Tooltip
              content={activity.prompt}
              fineType={activity.title}
              showAfterMs={100}
              renderDirection={DialogRenderDirection.Horizontal}
              key={activity.id}
            >
              <div
                className={classNames(css.ActivityItem, css[activity.type])}
                onClick={() => {
                  if (!activity.graph) return;
                  nodeGraphContext.switchToComponent(activity.graph, {
                    node: activity?.node || undefined,
                    pushHistory: true
                  });
                }}
              >
                <div className={css.ActivityLogo}>
                  <ClippyLogo isThinking />
                </div>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    </Portal>
  );
}

function SectionTitle({ title }) {
  return (
    <div className={css.SectionTitle}>
      <Label variant={TextType.Shy} size={LabelSize.Small}>
        {title}
      </Label>
    </div>
  );
}

interface PopupItemProps {
  title: string;
  description: string;
  type: PopupItemType;
  icon: IconName | 'AI';
  isHighlighted?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

function PromptTagSuggestion({ title, description, type, icon, isHighlighted, isDisabled, onClick }: PopupItemProps) {
  return (
    <div
      className={classNames(
        css.PromptTagSuggestionRoot,
        isHighlighted && css.__isHighlighted,
        isDisabled && css.__isDisabled
      )}
      onClick={onClick}
    >
      <div className={css.PromptTagSuggestionItem}>
        <div className={classNames(css.TagType, icon !== 'AI' && css[type])}>
          {icon === 'AI' ? (
            <div className={css.PromptTagSuggestionAiIconContainer}>
              <ClippyLogo isThinking />
            </div>
          ) : (
            <Icon icon={icon} variant={TextType.DefaultContrast} size={IconSize.Tiny} />
          )}
        </div>

        <div className={css.details}>
          <Label variant={TextType.Proud}>{title}</Label>
          <Text size={TextSize.Small}>{description}</Text>
        </div>
      </div>
    </div>
  );
}

function PromptTag({ title, type, onRemoveClick }) {
  return (
    <div className={classNames(css.PromptTagRoot, css[type])}>
      <Label size={LabelSize.Small} variant={TextType.DefaultContrast}>
        {title}
      </Label>

      <div className={css.PromptTagRemove} onClick={onRemoveClick}>
        <Icon icon={IconName.Close} size={IconSize.Tiny} />
      </div>
    </div>
  );
}

function ExamplePrompt({ prompt, onClick }) {
  return (
    <div className={css.ExamplePromptRoot}>
      <div className={css.ExamplePrompt} onClick={onClick}>
        <Text size={TextSize.Default}>"{prompt}"</Text>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21.7409 13.0157L9.92836 6.27347C9.72924 6.16177 9.50086 6.1133 9.27354 6.1345C9.04622 6.15569 8.83073 6.24554 8.65569 6.39212C8.48065 6.5387 8.35436 6.73506 8.29357 6.95512C8.23279 7.17519 8.2404 7.40854 8.31539 7.62417L10.4951 13.9853C10.4948 13.9877 10.4948 13.99 10.4951 13.9924C10.4947 13.9947 10.4947 13.9971 10.4951 13.9994L8.31539 20.3746C8.25533 20.5443 8.23684 20.7258 8.26147 20.9041C8.2861 21.0823 8.35313 21.2521 8.45693 21.3991C8.56073 21.5461 8.69828 21.666 8.85802 21.7488C9.01777 21.8317 9.19505 21.875 9.375 21.8751C9.57024 21.8746 9.76204 21.8238 9.93188 21.7275L21.738 14.9739C21.9122 14.8764 22.0573 14.7343 22.1583 14.5621C22.2594 14.39 22.3129 14.1941 22.3132 13.9945C22.3136 13.7948 22.2608 13.5987 22.1604 13.4262C22.0599 13.2538 21.9154 13.1111 21.7416 13.0129L21.7409 13.0157ZM9.375 20.7501V20.7438L11.4942 14.5626H15.5625C15.7117 14.5626 15.8548 14.5033 15.9602 14.3979C16.0657 14.2924 16.125 14.1493 16.125 14.0001C16.125 13.8509 16.0657 13.7079 15.9602 13.6024C15.8548 13.4969 15.7117 13.4376 15.5625 13.4376H11.4998L9.37922 7.25855L9.375 7.25011L21.1875 13.9882L9.375 20.7501Z"
        fill="#f5f5f5"
      />
    </svg>
  );
}
