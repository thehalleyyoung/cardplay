/**
 * @file Lever Slider UI Component
 * @module gofai/planning/lever-slider-ui
 *
 * Implements Step 293 from gofai_goalB.md:
 * - Add UI for "edit lever sliders" that tweak plan parameters before execution
 * - Allow users to adjust quantize strength, register shift, density changes, etc.
 * - Real-time preview of parameter adjustments
 * - Validate parameters remain within safe/legal bounds
 * - Preserve constraints while tweaking
 *
 * Key Principles:
 * - Make parameters intuitive (musical terms, not raw numbers)
 * - Show immediate feedback on what changes
 * - Warn if approaching constraint violations
 * - Support fine-grained and coarse adjustments
 * - Link adjustments back to goals and reasons
 *
 * @see src/gofai/planning/plan-types.ts (opcode parameter types)
 * @see src/gofai/planning/parameter-inference.ts (parameter bounds)
 * @see src/gofai/planning/constraint-satisfaction.ts (validation)
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { CPLPlan, PlanOpcode, OpcodeParameter } from './plan-types';
import type { CPLConstraint } from '../canon/cpl-types';
import type { ParameterBounds, ParameterMetadata } from './parameter-inference';

// ============================================================================
// Types
// ============================================================================

/**
 * Adjustable parameter with UI metadata
 */
export interface AdjustableParameter {
  /** Unique key for this parameter (opcode index + param name) */
  readonly key: string;

  /** Parameter name (e.g., "strength", "amount", "shift") */
  readonly name: string;

  /** Human-readable display name */
  readonly displayName: string;

  /** Current value */
  readonly value: number;

  /** Original value from plan generation */
  readonly originalValue: number;

  /** Valid bounds */
  readonly bounds: ParameterBounds;

  /** Parameter metadata (units, step size, etc.) */
  readonly metadata: ParameterMetadata;

  /** Which opcode step this parameter belongs to */
  readonly opcodeIndex: number;

  /** Opcode ID for context */
  readonly opcodeId: string;

  /** Human-readable description of what this parameter does */
  readonly description: string;

  /** Warning message if current value is risky */
  readonly warning?: string;
}

/**
 * Props for LeverSliderUI component
 */
export interface LeverSliderUIProps {
  /** The plan being edited */
  readonly plan: CPLPlan;

  /** Constraints that must be preserved */
  readonly constraints: readonly CPLConstraint[];

  /** Callback when parameters change */
  readonly onParametersChange: (adjustedPlan: CPLPlan) => void;

  /** Callback to validate adjusted plan */
  readonly onValidate: (plan: CPLPlan) => ValidationResult;

  /** Whether to show advanced parameters */
  readonly showAdvanced?: boolean;

  /** Whether sliders are disabled (e.g., during execution) */
  readonly disabled?: boolean;
}

/**
 * Result of plan validation after parameter adjustment
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly constraintViolations: readonly ConstraintViolation[];
}

/**
 * Specific constraint violation
 */
export interface ConstraintViolation {
  readonly constraintId: string;
  readonly description: string;
  readonly severity: 'error' | 'warning';
  readonly affectedOpcodes: readonly number[];
}

// ============================================================================
// Parameter Extraction and Classification
// ============================================================================

/**
 * Extract adjustable parameters from a plan
 */
function extractAdjustableParameters(plan: CPLPlan): AdjustableParameter[] {
  const parameters: AdjustableParameter[] = [];

  plan.steps.forEach((step, index) => {
    // Extract numeric parameters from opcode
    Object.entries(step.parameters || {}).forEach(([paramName, paramValue]) => {
      if (typeof paramValue === 'number' && isAdjustableParameter(step.opcodeId, paramName)) {
        const metadata = getParameterMetadata(step.opcodeId, paramName);
        const bounds = getParameterBounds(step.opcodeId, paramName, paramValue);

        parameters.push({
          key: `${index}:${paramName}`,
          name: paramName,
          displayName: metadata.displayName || formatParameterName(paramName),
          value: paramValue,
          originalValue: paramValue,
          bounds,
          metadata,
          opcodeIndex: index,
          opcodeId: step.opcodeId,
          description: metadata.description || `Adjust ${formatParameterName(paramName)}`,
          warning: getParameterWarning(paramValue, bounds, metadata),
        });
      }
    });
  });

  return parameters;
}

/**
 * Check if a parameter should be adjustable via UI
 */
function isAdjustableParameter(opcodeId: string, paramName: string): boolean {
  // Most numeric parameters are adjustable
  // Exceptions: IDs, flags, version numbers
  const nonAdjustable = ['id', 'version', 'index', 'count'];
  return !nonAdjustable.includes(paramName);
}

/**
 * Get metadata for a parameter
 */
function getParameterMetadata(opcodeId: string, paramName: string): ParameterMetadata {
  // Common parameter metadata
  const commonMetadata: Record<string, Partial<ParameterMetadata>> = {
    strength: {
      displayName: 'Strength',
      description: 'How strongly to apply this effect',
      units: '%',
      step: 1,
      precision: 0,
    },
    amount: {
      displayName: 'Amount',
      description: 'Amount of change to apply',
      units: '',
      step: 1,
      precision: 0,
    },
    shift: {
      displayName: 'Shift',
      description: 'Amount to shift (semitones, beats, or bars)',
      units: '',
      step: 1,
      precision: 0,
    },
    factor: {
      displayName: 'Factor',
      description: 'Multiplication factor',
      units: '×',
      step: 0.1,
      precision: 1,
    },
    threshold: {
      displayName: 'Threshold',
      description: 'Threshold value',
      units: '',
      step: 1,
      precision: 0,
    },
    ratio: {
      displayName: 'Ratio',
      description: 'Ratio or proportion',
      units: '',
      step: 0.05,
      precision: 2,
    },
  };

  // Opcode-specific metadata
  const opcodeSpecific = getOpcodeSpecificMetadata(opcodeId, paramName);

  return {
    displayName: paramName,
    description: `Adjust ${paramName}`,
    units: '',
    step: 1,
    precision: 0,
    ...commonMetadata[paramName],
    ...opcodeSpecific,
  };
}

/**
 * Get opcode-specific parameter metadata
 */
function getOpcodeSpecificMetadata(
  opcodeId: string,
  paramName: string
): Partial<ParameterMetadata> {
  const opcodeMetadata: Record<string, Record<string, Partial<ParameterMetadata>>> = {
    'opcode:rhythm:quantize': {
      strength: {
        description: 'Quantization strength (0 = no quantize, 100 = fully quantized)',
        bounds: { min: 0, max: 100, default: 80 },
      },
    },
    'opcode:event:shift_register': {
      shift: {
        displayName: 'Register Shift',
        description: 'Semitones to shift up (positive) or down (negative)',
        units: 'semitones',
        step: 1,
        precision: 0,
      },
    },
    'opcode:texture:thin': {
      amount: {
        displayName: 'Thinning Amount',
        description: 'How much to reduce density (0-100%)',
        units: '%',
        bounds: { min: 0, max: 100, default: 30 },
      },
    },
    'opcode:texture:densify': {
      amount: {
        displayName: 'Density Increase',
        description: 'How much to increase density (0-100%)',
        units: '%',
        bounds: { min: 0, max: 100, default: 30 },
      },
    },
    'opcode:rhythm:swing': {
      amount: {
        displayName: 'Swing Amount',
        description: 'Swing feel (50 = straight, 66 = heavy swing)',
        units: '%',
        bounds: { min: 50, max: 75, default: 60 },
      },
    },
    'opcode:rhythm:humanize': {
      amount: {
        displayName: 'Humanization',
        description: 'Timing variation amount (0-100%)',
        units: '%',
        bounds: { min: 0, max: 100, default: 20 },
      },
    },
    'opcode:harmony:revoice': {
      spread: {
        displayName: 'Voicing Spread',
        description: 'How widely to space voices (semitones)',
        units: 'semitones',
        bounds: { min: 3, max: 24, default: 12 },
      },
    },
  };

  return opcodeMetadata[opcodeId]?.[paramName] || {};
}

/**
 * Get bounds for a parameter
 */
function getParameterBounds(
  opcodeId: string,
  paramName: string,
  currentValue: number
): ParameterBounds {
  // Get opcode-specific bounds if available
  const metadata = getOpcodeSpecificMetadata(opcodeId, paramName);
  if (metadata.bounds) {
    return metadata.bounds;
  }

  // Default bounds based on parameter name
  const defaultBounds: Record<string, ParameterBounds> = {
    strength: { min: 0, max: 100, default: 50 },
    amount: { min: -100, max: 100, default: 0 },
    shift: { min: -24, max: 24, default: 0 },
    factor: { min: 0.1, max: 10, default: 1 },
    threshold: { min: 0, max: 100, default: 50 },
    ratio: { min: 0, max: 1, default: 0.5 },
  };

  const bounds = defaultBounds[paramName] || {
    min: Math.min(currentValue - 50, 0),
    max: Math.max(currentValue + 50, 100),
    default: currentValue,
  };

  return bounds;
}

/**
 * Get warning message for a parameter value if risky
 */
function getParameterWarning(
  value: number,
  bounds: ParameterBounds,
  metadata: ParameterMetadata
): string | undefined {
  // Warn if at extremes
  const range = bounds.max - bounds.min;
  const normalized = (value - bounds.min) / range;

  if (normalized < 0.1) {
    return `Very low ${metadata.displayName} - may have minimal effect`;
  }
  if (normalized > 0.9) {
    return `Very high ${metadata.displayName} - may be destructive`;
  }

  return undefined;
}

/**
 * Format parameter name for display
 */
function formatParameterName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// Component
// ============================================================================

/**
 * LeverSliderUI: Interactive parameter adjustment interface
 */
export function LeverSliderUI(props: LeverSliderUIProps): React.ReactElement {
  const {
    plan,
    constraints,
    onParametersChange,
    onValidate,
    showAdvanced = false,
    disabled = false,
  } = props;

  // Extract adjustable parameters
  const parameters = useMemo(() => extractAdjustableParameters(plan), [plan]);

  // Track which parameters have been modified
  const [modifiedParams, setModifiedParams] = useState<Set<string>>(new Set());

  // Track current validation result
  const [validation, setValidation] = useState<ValidationResult>(() =>
    onValidate(plan)
  );

  // Handle parameter value change
  const handleParameterChange = useCallback(
    (param: AdjustableParameter, newValue: number) => {
      // Clamp to bounds
      const clampedValue = Math.max(
        param.bounds.min,
        Math.min(param.bounds.max, newValue)
      );

      // Update plan with new parameter value
      const updatedSteps = plan.steps.map((step, index) => {
        if (index === param.opcodeIndex) {
          return {
            ...step,
            parameters: {
              ...step.parameters,
              [param.name]: clampedValue,
            },
          };
        }
        return step;
      });

      const updatedPlan: CPLPlan = {
        ...plan,
        steps: updatedSteps,
      };

      // Mark as modified
      setModifiedParams(prev => new Set(prev).add(param.key));

      // Validate
      const validationResult = onValidate(updatedPlan);
      setValidation(validationResult);

      // Notify parent
      onParametersChange(updatedPlan);
    },
    [plan, onValidate, onParametersChange]
  );

  // Reset parameter to original value
  const handleReset = useCallback(
    (param: AdjustableParameter) => {
      handleParameterChange(param, param.originalValue);
      setModifiedParams(prev => {
        const next = new Set(prev);
        next.delete(param.key);
        return next;
      });
    },
    [handleParameterChange]
  );

  // Reset all parameters
  const handleResetAll = useCallback(() => {
    parameters.forEach(param => {
      if (modifiedParams.has(param.key)) {
        handleParameterChange(param, param.originalValue);
      }
    });
    setModifiedParams(new Set());
  }, [parameters, modifiedParams, handleParameterChange]);

  // Filter parameters based on showAdvanced
  const visibleParameters = useMemo(() => {
    if (showAdvanced) {
      return parameters;
    }
    // Show only primary parameters in basic mode
    return parameters.filter(p =>
      ['strength', 'amount', 'shift', 'factor'].includes(p.name)
    );
  }, [parameters, showAdvanced]);

  const hasModifications = modifiedParams.size > 0;

  return (
    <div className="lever-slider-ui">
      <div className="lever-slider-header">
        <h3>Adjust Plan Parameters</h3>
        {hasModifications && (
          <button
            className="reset-all-button"
            onClick={handleResetAll}
            disabled={disabled}
          >
            Reset All
          </button>
        )}
      </div>

      {validation.errors.length > 0 && (
        <div className="validation-errors">
          <strong>Errors:</strong>
          <ul>
            {validation.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="validation-warnings">
          <strong>Warnings:</strong>
          <ul>
            {validation.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.constraintViolations.length > 0 && (
        <div className="constraint-violations">
          <strong>Constraint Violations:</strong>
          <ul>
            {validation.constraintViolations.map((violation, i) => (
              <li key={i}>
                <span className={`severity-${violation.severity}`}>
                  {violation.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="parameter-sliders">
        {visibleParameters.length === 0 && (
          <div className="no-parameters">
            No adjustable parameters in this plan.
          </div>
        )}

        {visibleParameters.map(param => (
          <ParameterSlider
            key={param.key}
            parameter={param}
            isModified={modifiedParams.has(param.key)}
            onChange={handleParameterChange}
            onReset={handleReset}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Parameter Slider Component
// ============================================================================

interface ParameterSliderProps {
  readonly parameter: AdjustableParameter;
  readonly isModified: boolean;
  readonly onChange: (param: AdjustableParameter, value: number) => void;
  readonly onReset: (param: AdjustableParameter) => void;
  readonly disabled: boolean;
}

function ParameterSlider(props: ParameterSliderProps): React.ReactElement {
  const { parameter, isModified, onChange, onReset, disabled } = props;

  const [localValue, setLocalValue] = useState(parameter.value);

  // Sync with external changes
  React.useEffect(() => {
    setLocalValue(parameter.value);
  }, [parameter.value]);

  const handleSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(event.target.value);
      setLocalValue(newValue);
      onChange(parameter, newValue);
    },
    [parameter, onChange]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(event.target.value);
      if (!isNaN(newValue)) {
        setLocalValue(newValue);
        onChange(parameter, newValue);
      }
    },
    [parameter, onChange]
  );

  const handleReset = useCallback(() => {
    onReset(parameter);
  }, [parameter, onReset]);

  const range = parameter.bounds.max - parameter.bounds.min;
  const normalizedValue =
    ((localValue - parameter.bounds.min) / range) * 100;

  return (
    <div className={`parameter-slider ${isModified ? 'modified' : ''}`}>
      <div className="parameter-header">
        <label htmlFor={`slider-${parameter.key}`}>
          {parameter.displayName}
        </label>
        {isModified && (
          <button
            className="reset-button"
            onClick={handleReset}
            disabled={disabled}
            title="Reset to original value"
          >
            ↺
          </button>
        )}
      </div>

      <div className="parameter-description">{parameter.description}</div>

      <div className="slider-container">
        <span className="slider-min">
          {parameter.bounds.min}
          {parameter.metadata.units}
        </span>

        <input
          id={`slider-${parameter.key}`}
          type="range"
          min={parameter.bounds.min}
          max={parameter.bounds.max}
          step={parameter.metadata.step}
          value={localValue}
          onChange={handleSliderChange}
          disabled={disabled}
          className="slider"
        />

        <span className="slider-max">
          {parameter.bounds.max}
          {parameter.metadata.units}
        </span>
      </div>

      <div className="value-input-container">
        <input
          type="number"
          min={parameter.bounds.min}
          max={parameter.bounds.max}
          step={parameter.metadata.step}
          value={localValue.toFixed(parameter.metadata.precision)}
          onChange={handleInputChange}
          disabled={disabled}
          className="value-input"
        />
        <span className="value-units">{parameter.metadata.units}</span>
      </div>

      {parameter.warning && (
        <div className="parameter-warning">{parameter.warning}</div>
      )}

      <div className="parameter-context">
        Step {parameter.opcodeIndex + 1}: {parameter.opcodeId}
      </div>

      <div
        className="slider-fill"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}

// ============================================================================
// CSS (for reference - should be in separate stylesheet)
// ============================================================================

// .lever-slider-ui {
//   padding: 16px;
//   background: var(--surface-1);
//   border-radius: 8px;
// }
//
// .lever-slider-header {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 16px;
// }
//
// .parameter-sliders {
//   display: flex;
//   flex-direction: column;
//   gap: 20px;
// }
//
// .parameter-slider {
//   padding: 12px;
//   background: var(--surface-2);
//   border-radius: 6px;
//   border: 2px solid transparent;
//   transition: border-color 0.2s;
// }
//
// .parameter-slider.modified {
//   border-color: var(--accent-primary);
// }
//
// .slider-container {
//   display: flex;
//   align-items: center;
//   gap: 12px;
//   margin: 12px 0;
// }
//
// .slider {
//   flex: 1;
//   height: 6px;
//   border-radius: 3px;
//   appearance: none;
//   background: var(--surface-3);
// }
//
// .slider::-webkit-slider-thumb {
//   appearance: none;
//   width: 16px;
//   height: 16px;
//   border-radius: 50%;
//   background: var(--accent-primary);
//   cursor: pointer;
// }
//
// .value-input-container {
//   display: flex;
//   align-items: center;
//   gap: 8px;
// }
//
// .value-input {
//   width: 80px;
//   padding: 4px 8px;
//   border-radius: 4px;
//   border: 1px solid var(--border-1);
// }
//
// .validation-errors,
// .validation-warnings,
// .constraint-violations {
//   padding: 12px;
//   margin-bottom: 16px;
//   border-radius: 6px;
// }
//
// .validation-errors {
//   background: var(--error-bg);
//   border: 1px solid var(--error-border);
//   color: var(--error-text);
// }
//
// .validation-warnings {
//   background: var(--warning-bg);
//   border: 1px solid var(--warning-border);
//   color: var(--warning-text);
// }
