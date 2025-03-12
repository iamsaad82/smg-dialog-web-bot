import UIComponentsManager from './UIComponentsManager';

// Konfigurationseditor
export { ConfigEditor } from './config-editor/ConfigEditor';
export { BasePromptEditor } from './config-editor/BasePromptEditor';
export { ComponentRulesEditor } from './config-editor/ComponentRulesEditor';
export { ComponentRuleItem } from './config-editor/ComponentRuleItem';
export { PromptPreview } from './config-editor/PromptPreview';

// Vorschau
export { ChatPreview } from './preview/ChatPreview';

// Definitionen
export { DefinitionsManager } from './definitions/DefinitionsManager';
export { DefinitionList } from './definitions/DefinitionList';
export { DefinitionEditor } from './definitions/DefinitionEditor';
export { DeleteConfirmation } from './definitions/DeleteConfirmation';

// Gemeinsame Komponenten
export { SectionHeading, HelpText } from './shared/SectionHeading';

// Typen und Hilfsfunktionen
export * from './shared/types';
export * from './shared/utils';
export * from './shared/constants';

// Hauptkomponente - sowohl als default als auch als benannter Export
export { UIComponentsManager }; // Named export
export default UIComponentsManager; // Default export 