import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SectionHeading, HelpText } from '../shared/SectionHeading';

interface BasePromptEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Editor für den Basis-Prompt des Bots
 */
export const BasePromptEditor: React.FC<BasePromptEditorProps> = ({
  value,
  onChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basis-Prompt</CardTitle>
        <CardDescription>
          Die Grundanweisungen für den Bot und die Art seiner Kommunikation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeading 
          title="Persönlichkeit des Bots"
          description="Hier können Sie bestimmen, wie der Bot sich ausdrücken und verhalten soll"
        />
        
        <HelpText>
          Beschreiben Sie, für welche Art von Organisation der Bot agiert und wie er sich gegenüber Nutzern verhalten soll.
          Die Komponenten-Regeln werden automatisch zu diesem Basis-Prompt hinzugefügt.
        </HelpText>
        
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Du bist ein hilfreicher Assistent für ein Shopping Center. Du sollst höflich und informativ sein..."
          className="min-h-32 font-mono text-sm"
        />
      </CardContent>
    </Card>
  );
}; 