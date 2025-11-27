
import React from 'react';
import { Info, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { MatchingConfig } from '../../types';

interface MatchingConfigPanelProps {
  config: MatchingConfig;
  onConfigChange: (key: keyof MatchingConfig, value: number | boolean) => void;
  title?: string;
  description?: string;
  compact?: boolean;
}

const MatchingConfigPanel: React.FC<MatchingConfigPanelProps> = ({
  config,
  onConfigChange,
  title = "Matching Algorithm Configuration",
  description = "Define how the AI scores candidates against this job description.",
  compact = false
}) => {
  return (
    <Card className={compact ? "border-0 shadow-none" : "border-primary/20 shadow-md"}>
      {!compact && (
        <CardHeader className="bg-primary/5 pb-8 border-b">
          <div className="flex items-center gap-2 text-primary">
            <BrainCircuit className="h-6 w-6" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-0 space-y-8" : "space-y-8 pt-8"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Thresholds */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Scoring Thresholds</h3>
              <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                <Info className="h-3 w-3 mr-1" />
                Auto-tagging rules
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Minimum Match Score ({config.minMatchThreshold}%)</Label>
              </div>
              <Slider
                value={config.minMatchThreshold}
                min={50}
                max={95}
                step={1}
                onValueChange={(val) => onConfigChange('minMatchThreshold', val)}
                className="[&::-webkit-slider-thumb]:bg-primary"
              />
              <p className="text-xs text-muted-foreground">
                Candidates with a score lower than {config.minMatchThreshold}% will be flagged as "Low Match".
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Strict Keyword Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Require exact matches for "Must Have" skills.
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                checked={config.strictMode}
                onChange={(e) => onConfigChange('strictMode', e.target.checked)}
              />
            </div>
          </div>

          {/* Weights */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Criteria Weights</h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Skills & Keywords</Label>
                  <span className="text-sm font-medium">{config.skillsWeight}%</span>
                </div>
                <Slider
                  value={config.skillsWeight}
                  onValueChange={(val) => onConfigChange('skillsWeight', val)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Experience & Titles</Label>
                  <span className="text-sm font-medium">{config.experienceWeight}%</span>
                </div>
                <Slider
                  value={config.experienceWeight}
                  onValueChange={(val) => onConfigChange('experienceWeight', val)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Education & Certifications</Label>
                  <span className="text-sm font-medium">{config.educationWeight}%</span>
                </div>
                <Slider
                  value={config.educationWeight}
                  onValueChange={(val) => onConfigChange('educationWeight', val)}
                />
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                <Info className="h-3 w-3" />
                Remaining {100 - (config.skillsWeight + config.experienceWeight + config.educationWeight)}% allocated to formatting & context.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchingConfigPanel;
