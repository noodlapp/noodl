import React from 'react';

import { AiIcon } from '@noodl-core-ui/components/ai/AiIcon';
import { Markdown } from '@noodl-core-ui/components/common/Markdown';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { HStack } from '@noodl-core-ui/components/layout/Stack';
import { UserBadge, UserBadgeSize } from '@noodl-core-ui/components/user/UserBadge';
import { Slot } from '@noodl-core-ui/types/global';

import css from './AiChatMessage.module.scss';

export type AiChatUser =
  | {
      role: 'user';
      name: string;
    }
  | {
      role: 'assistant';
    }
  | null;

export interface AiChatMessageProps {
  user?: AiChatUser;
  content: string;

  affix?: Slot;
}

export function AiChatMessage({ user, content, affix }: AiChatMessageProps) {
  return (
    <Box hasXSpacing hasYSpacing UNSAFE_className={css['Root']}>
      <HStack UNSAFE_style={{ height: 'auto', minHeight: '18px' }}>
        {Boolean(user) && (
          <Box hasRightSpacing>
            <div style={{ position: 'relative', width: '18px' }}>
              {user.role === 'user' && (
                <UserBadge size={UserBadgeSize.Tiny} name={user.name} email={user.name} id={user.name} />
              )}
              {user.role === 'assistant' && (
                <AiIcon
                  UNSAFE_style={{
                    position: 'absolute',
                    left: '-3px',
                    top: '-2px'
                  }}
                />
              )}
            </div>
          </Box>
        )}
        <Markdown content={content} UNSAFE_style={{ marginTop: '2px', userSelect: 'text' }} />
      </HStack>
      {Boolean(affix) && <Box hasTopSpacing>{affix}</Box>}
    </Box>
  );
}
