import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('usePhotoboothMachine')) {
  code = code.replace(/import { KioskConfig, PhotoboothSession, CapturedPhoto, PhotoFilterId, TemplateLayoutId, PaperThemeId } from '\.\/types';/, "import { KioskConfig, PhotoboothSession, CapturedPhoto, PhotoFilterId, TemplateLayoutId, PaperThemeId, MachineState } from './types';\nimport { usePhotoboothMachine } from './services/stateMachine';");
}

fs.writeFileSync('src/App.tsx', code);
