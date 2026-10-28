import fs from 'fs';
let code = fs.readFileSync('src/services/stateMachine.ts', 'utf8');

const triggerFlash = `
        case 'TRIGGER_FLASH':
          if (prev.currentState === 'PHOTO_1_COUNTDOWN') next.currentState = 'PHOTO_1_CAPTURE';
          else if (prev.currentState === 'PHOTO_2_COUNTDOWN') next.currentState = 'PHOTO_2_CAPTURE';
          else if (prev.currentState === 'PHOTO_3_COUNTDOWN') next.currentState = 'PHOTO_3_CAPTURE';
          break;
`;

code = code.replace(/\| \{ type: 'PHOTO_CAPTURED'; photo: CapturedPhoto \}/, "| { type: 'PHOTO_CAPTURED'; photo: CapturedPhoto }\n  | { type: 'TRIGGER_FLASH' }");
code = code.replace(/case 'PHOTO_CAPTURED':/, triggerFlash + '\n        case \'PHOTO_CAPTURED\':');

fs.writeFileSync('src/services/stateMachine.ts', code);
