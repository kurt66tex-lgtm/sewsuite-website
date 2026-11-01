import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hasChatFollowupPermission,validConversationalLead} from '../api/chat-conversation-permission.mjs';
