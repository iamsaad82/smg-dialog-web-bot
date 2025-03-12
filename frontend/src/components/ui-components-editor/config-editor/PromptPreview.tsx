import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SectionHeading, HelpText } from '../shared/SectionHeading';
import { ComponentRule } from '../shared/types';
import { generatePrompt } from '../shared/utils';

interface PromptPreviewProps {
  basePrompt: string;
  rules: ComponentRule[];
}

/**
 * Zeigt eine Vorschau des generierten Prompts an
 */
export const PromptPreview: React.FC<PromptPreviewProps> = ({
  basePrompt,
  rules
}) => {
  // Prompt generieren
  const fullPrompt = generatePrompt(basePrompt, rules);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generierter Prompt</CardTitle>
        <CardDescription>
          So werden Ihre Anweisungen an den Bot übermittelt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeading 
          title="Bot-Anweisungen im LLM-Format"
          description="Diese Anweisungen werden verwendet, um das Sprachmodell zu steuern"
        />
        
        <HelpText>
          Dieser Prompt wird automatisch aus dem Basis-Prompt und den Komponenten-Regeln generiert.
          Er wird dem Sprachmodell bei jeder Anfrage mitgegeben, damit es weiß, wann es interaktive Komponenten verwenden soll.
        </HelpText>
        
        <div className="bg-muted p-4 rounded-md overflow-auto max-h-80">
          <pre className="text-xs font-mono whitespace-pre-wrap break-words">
            {fullPrompt}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}; 