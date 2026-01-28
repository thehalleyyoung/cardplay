/**
 * @fileoverview CardScript Security Validation.
 * 
 * Provides security checks and input validation for CardScript code
 * to prevent injection attacks, malicious code, and common bugs.
 * 
 * Security checks include:
 * - Dangerous function detection (eval, Function constructor, etc.)
 * - Prototype pollution prevention
 * - Infinite loop detection (static analysis)
 * - Resource exhaustion prevention
 * - Unsafe property access detection
 * - Code injection patterns
 * 
 * @module @cardplay/user-cards/cardscript/security
 */

import type * as AST from './ast';
import { traverse } from './ast';

// ============================================================================
// SECURITY ISSUE TYPES
// ============================================================================

/**
 * Severity levels for security issues.
 */
export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Security issue categories.
 */
export type SecurityCategory = 
  | 'injection'        // Code injection vulnerabilities
  | 'prototype'        // Prototype pollution
  | 'resource'         // Resource exhaustion (infinite loops, memory)
  | 'access'           // Unsafe property/variable access
  | 'unsafe-function'  // Dangerous built-in functions
  | 'data-leak'        // Potential data exfiltration
  | 'denial-of-service'// DoS vulnerabilities
  | 'logic-bug';       // Logic errors that could be exploited

/**
 * A detected security issue.
 */
export interface SecurityIssue {
  /** Unique identifier for issue type */
  readonly code: string;
  /** Human-readable message */
  readonly message: string;
  /** Issue severity */
  readonly severity: SecuritySeverity;
  /** Issue category */
  readonly category: SecurityCategory;
  /** Source location if available */
  readonly location?: {
    readonly line: number;
    readonly column: number;
    readonly file?: string;
  };
  /** Suggested fix */
  readonly suggestion?: string;
  /** The problematic code snippet */
  readonly snippet?: string;
}

/**
 * Result of security validation.
 */
export interface SecurityValidationResult {
  /** Whether the code passed all critical checks */
  readonly passed: boolean;
  /** All detected issues */
  readonly issues: readonly SecurityIssue[];
  /** Critical issues that must be fixed */
  readonly critical: readonly SecurityIssue[];
  /** High severity issues */
  readonly high: readonly SecurityIssue[];
  /** Medium severity issues */
  readonly medium: readonly SecurityIssue[];
  /** Low severity issues */
  readonly low: readonly SecurityIssue[];
  /** Informational notices */
  readonly info: readonly SecurityIssue[];
  /** Summary statistics */
  readonly stats: {
    readonly total: number;
    readonly bySeverity: Record<SecuritySeverity, number>;
    readonly byCategory: Partial<Record<SecurityCategory, number>>;
  };
}

// ============================================================================
// SECURITY RULES
// ============================================================================

/**
 * Dangerous function names that should be blocked.
 */
const DANGEROUS_FUNCTIONS = new Set([
  'eval',
  'Function',
  'setTimeout',     // Can execute strings
  'setInterval',    // Can execute strings
  'setImmediate',
  'execScript',
  'document.write',
  'document.writeln',
  'innerHTML',
  'outerHTML',
  'insertAdjacentHTML',
]);

/**
 * Dangerous global objects.
 */
const DANGEROUS_GLOBALS = new Set([
  'window',
  'global',
  'globalThis',
  'self',
  'parent',
  'top',
  'frames',
  'location',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'XMLHttpRequest',
  'fetch',
  'WebSocket',
  'Worker',
  'SharedWorker',
  'ServiceWorker',
  'importScripts',
  'require',
  'module',
  'exports',
  '__dirname',
  '__filename',
  'process',
  'Buffer',
]);

/**
 * Properties that could lead to prototype pollution.
 */
const PROTOTYPE_POLLUTION_PROPS = new Set([
  '__proto__',
  'prototype',
  'constructor',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

/**
 * Suspicious patterns that might indicate injection attempts.
 */
const INJECTION_PATTERNS = [
  /\beval\s*\(/i,
  /\bnew\s+Function\s*\(/i,
  /\bdocument\s*\.\s*write/i,
  /\bwindow\s*\[\s*['"`]/i,
  /\bglobal\s*\[\s*['"`]/i,
  /\bthis\s*\[\s*['"`]\s*\+/i,  // Dynamic property access with concatenation
  /\[\s*['"`]\s*\+.*\+\s*['"`]\s*\]/i,  // String concatenation in brackets
  /fromCharCode/i,
  /\\x[0-9a-f]{2}/i,  // Hex escape sequences
  /\\u[0-9a-f]{4}/i,  // Unicode escape sequences in suspicious context
  /atob\s*\(/i,       // Base64 decode (could hide payload)
  /btoa\s*\(/i,       // Base64 encode
];

/**
 * Maximum allowed complexity metrics.
 */
const COMPLEXITY_LIMITS = {
  maxNestingDepth: 10,
  maxFunctionParams: 20,
  maxStatements: 1000,
  maxLoopIterations: 10000,  // For statically analyzable loops
  maxStringLength: 100000,
  maxArrayLength: 100000,
  maxObjectKeys: 1000,
  maxCallStackDepth: 100,
};

// ============================================================================
// SECURITY CHECKER CLASS
// ============================================================================

/**
 * Security checker for CardScript AST.
 */
export class SecurityChecker {
  private issues: SecurityIssue[] = [];
  private options: SecurityCheckerOptions;
  private nestingDepth = 0;
  private statementCount = 0;
  
  constructor(options: Partial<SecurityCheckerOptions> = {}) {
    this.options = {
      allowDangerousFunctions: false,
      allowGlobalAccess: false,
      allowPrototypeAccess: false,
      allowDynamicPropertyAccess: true,  // Allow computed properties by default
      maxComplexity: COMPLEXITY_LIMITS,
      customBlocklist: [],
      customAllowlist: [],
      ...options,
    };
  }
  
  /**
   * Validates a CardScript AST for security issues.
   */
  check(ast: AST.Program): SecurityValidationResult {
    this.issues = [];
    this.nestingDepth = 0;
    this.statementCount = 0;
    
    // Traverse and check the AST
    this.checkProgram(ast);
    
    // Categorize issues
    const critical = this.issues.filter(i => i.severity === 'critical');
    const high = this.issues.filter(i => i.severity === 'high');
    const medium = this.issues.filter(i => i.severity === 'medium');
    const low = this.issues.filter(i => i.severity === 'low');
    const info = this.issues.filter(i => i.severity === 'info');
    
    // Build stats
    const bySeverity: Record<SecuritySeverity, number> = {
      critical: critical.length,
      high: high.length,
      medium: medium.length,
      low: low.length,
      info: info.length,
    };
    
    const byCategory: Partial<Record<SecurityCategory, number>> = {};
    for (const issue of this.issues) {
      byCategory[issue.category] = (byCategory[issue.category] ?? 0) + 1;
    }
    
    return {
      passed: critical.length === 0,
      issues: this.issues,
      critical,
      high,
      medium,
      low,
      info,
      stats: {
        total: this.issues.length,
        bySeverity,
        byCategory,
      },
    };
  }
  
  /**
   * Checks the program.
   */
  private checkProgram(program: AST.Program): void {
    for (const node of program.body) {
      this.checkNode(node as AST.ASTNode);
      this.statementCount++;
      
      if (this.statementCount > this.options.maxComplexity.maxStatements) {
        this.addIssue({
          code: 'SEC001',
          message: `Program exceeds maximum statement count (${this.options.maxComplexity.maxStatements})`,
          severity: 'high',
          category: 'resource',
          suggestion: 'Split the code into smaller modules or functions',
        });
        break;
      }
    }
  }
  
  /**
   * Checks a single AST node.
   */
  private checkNode(node: AST.ASTNode): void {
    switch (node.kind) {
      case 'CardDeclaration':
        this.checkCardDeclaration(node);
        break;
      case 'FunctionDeclaration':
      case 'FunctionExpression':
        this.checkFunction(node as AST.FunctionDeclaration);
        break;
      case 'CallExpression':
        this.checkCallExpression(node);
        break;
      case 'MemberExpression':
        this.checkMemberExpression(node);
        break;
      case 'IndexExpression':
        this.checkIndexExpression(node);
        break;
      case 'Identifier':
        this.checkIdentifier(node);
        break;
      case 'StringLiteral':
        this.checkStringLiteral(node);
        break;
      case 'ForStatement':
      case 'WhileStatement':
        this.checkLoop(node as AST.ForStatement | AST.WhileStatement);
        break;
      case 'IfStatement':
        this.checkIfStatement(node);
        break;
      case 'BlockStatement':
        this.checkBlockStatement(node);
        break;
      case 'ObjectLiteral':
        this.checkObjectLiteral(node);
        break;
      case 'ArrayLiteral':
        this.checkArrayLiteral(node);
        break;
      case 'AssignmentExpression':
        this.checkAssignment(node);
        break;
    }
    
    // Recursively check children
    traverse(node, {
      // Skip the node itself, only check children
    });
  }
  
  /**
   * Checks a card declaration.
   */
  private checkCardDeclaration(card: AST.CardDeclaration): void {
    // Check card name for suspicious patterns
    if (this.isSuspiciousName(card.name)) {
      this.addIssue({
        code: 'SEC010',
        message: `Suspicious card name: "${card.name}"`,
        severity: 'medium',
        category: 'injection',
        location: this.getLocation(card),
        suggestion: 'Use alphanumeric card names without special characters',
      });
    }
    
    // Check all card members
    for (const member of card.members) {
      this.checkNode(member as AST.ASTNode);
    }
  }
  
  /**
   * Checks a function declaration.
   */
  private checkFunction(fn: AST.FunctionDeclaration): void {
    // Check parameter count
    if (fn.params.length > this.options.maxComplexity.maxFunctionParams) {
      this.addIssue({
        code: 'SEC002',
        message: `Function has too many parameters (${fn.params.length})`,
        severity: 'low',
        category: 'resource',
        location: this.getLocation(fn),
        suggestion: `Reduce parameters to ${this.options.maxComplexity.maxFunctionParams} or less`,
      });
    }
    
    // Track nesting
    this.nestingDepth++;
    if (this.nestingDepth > this.options.maxComplexity.maxNestingDepth) {
      this.addIssue({
        code: 'SEC003',
        message: `Code nesting too deep (${this.nestingDepth} levels)`,
        severity: 'medium',
        category: 'resource',
        location: this.getLocation(fn),
        suggestion: 'Reduce nesting by extracting code into separate functions',
      });
    }
    
    // Check body
    this.checkNode(fn.body);
    this.nestingDepth--;
  }
  
  /**
   * Checks a call expression for dangerous functions.
   */
  private checkCallExpression(call: AST.CallExpression): void {
    const callee = this.getCalleeName(call.callee);
    
    // Check against dangerous functions
    if (!this.options.allowDangerousFunctions && DANGEROUS_FUNCTIONS.has(callee)) {
      this.addIssue({
        code: 'SEC100',
        message: `Dangerous function call: ${callee}()`,
        severity: 'critical',
        category: 'unsafe-function',
        location: this.getLocation(call),
        suggestion: `Remove or replace the call to ${callee}`,
        snippet: callee,
      });
    }
    
    // Check for dynamic function construction
    if (callee === 'Function' || callee === 'eval') {
      this.addIssue({
        code: 'SEC101',
        message: 'Dynamic code execution detected',
        severity: 'critical',
        category: 'injection',
        location: this.getLocation(call),
        suggestion: 'Avoid eval() and new Function(). Use static code instead.',
      });
    }
    
    // Check for potential injection in string arguments
    for (const arg of call.arguments) {
      if (arg.kind === 'StringLiteral') {
        this.checkStringForInjection(arg.value, this.getLocation(arg));
      } else if (arg.kind === 'BinaryExpression' && this.isStringConcatenation(arg)) {
        this.addIssue({
          code: 'SEC102',
          message: 'String concatenation in function argument may indicate injection',
          severity: 'medium',
          category: 'injection',
          location: this.getLocation(arg),
          suggestion: 'Use template strings or parameterized functions',
        });
      }
    }
    
    // Recursively check arguments
    for (const arg of call.arguments) {
      this.checkNode(arg);
    }
    
    // Check callee
    this.checkNode(call.callee);
  }
  
  /**
   * Checks member expressions for dangerous property access.
   */
  private checkMemberExpression(expr: AST.MemberExpression): void {
    const propName = expr.property;
    
    // Check for prototype pollution
    if (!this.options.allowPrototypeAccess && PROTOTYPE_POLLUTION_PROPS.has(propName)) {
      this.addIssue({
        code: 'SEC200',
        message: `Prototype pollution risk: accessing "${propName}"`,
        severity: 'critical',
        category: 'prototype',
        location: this.getLocation(expr),
        suggestion: `Do not access "${propName}" directly`,
        snippet: propName,
      });
    }
    
    // Check for dangerous global access
    if (expr.object.kind === 'Identifier' && 
        !this.options.allowGlobalAccess && 
        DANGEROUS_GLOBALS.has(expr.object.name)) {
      this.addIssue({
        code: 'SEC201',
        message: `Unsafe global access: ${expr.object.name}.${propName}`,
        severity: 'high',
        category: 'access',
        location: this.getLocation(expr),
        suggestion: `Avoid accessing the "${expr.object.name}" global`,
      });
    }
    
    // Check object
    this.checkNode(expr.object);
  }
  
  /**
   * Checks index expressions (computed property access).
   */
  private checkIndexExpression(expr: AST.IndexExpression): void {
    // Dynamic property access could be used for injection
    if (!this.options.allowDynamicPropertyAccess) {
      if (expr.index.kind !== 'NumberLiteral' && expr.index.kind !== 'StringLiteral') {
        this.addIssue({
          code: 'SEC202',
          message: 'Dynamic property access detected',
          severity: 'medium',
          category: 'access',
          location: this.getLocation(expr),
          suggestion: 'Use static property names when possible',
        });
      }
    }
    
    // Check for prototype pollution via computed access
    if (expr.index.kind === 'StringLiteral' && 
        PROTOTYPE_POLLUTION_PROPS.has(expr.index.value)) {
      this.addIssue({
        code: 'SEC203',
        message: `Prototype pollution risk: computed access to "${expr.index.value}"`,
        severity: 'critical',
        category: 'prototype',
        location: this.getLocation(expr),
        suggestion: `Do not access "${expr.index.value}" via computed property`,
      });
    }
    
    this.checkNode(expr.object);
    this.checkNode(expr.index);
  }
  
  /**
   * Checks identifier references.
   */
  private checkIdentifier(id: AST.Identifier): void {
    // Check for dangerous global references
    if (!this.options.allowGlobalAccess && DANGEROUS_GLOBALS.has(id.name)) {
      this.addIssue({
        code: 'SEC300',
        message: `Reference to dangerous global: ${id.name}`,
        severity: 'high',
        category: 'access',
        location: this.getLocation(id),
        suggestion: `Do not reference "${id.name}"`,
        snippet: id.name,
      });
    }
    
    // Check custom blocklist
    if (this.options.customBlocklist.includes(id.name)) {
      this.addIssue({
        code: 'SEC301',
        message: `Blocked identifier: ${id.name}`,
        severity: 'high',
        category: 'access',
        location: this.getLocation(id),
        suggestion: `"${id.name}" is not allowed`,
      });
    }
  }
  
  /**
   * Checks string literals for suspicious content.
   */
  private checkStringLiteral(str: AST.StringLiteral): void {
    this.checkStringForInjection(str.value, this.getLocation(str));
    
    // Check string length
    if (str.value.length > this.options.maxComplexity.maxStringLength) {
      this.addIssue({
        code: 'SEC400',
        message: `String exceeds maximum length (${str.value.length})`,
        severity: 'medium',
        category: 'resource',
        location: this.getLocation(str),
        suggestion: `Keep strings under ${this.options.maxComplexity.maxStringLength} characters`,
      });
    }
  }
  
  /**
   * Checks a string value for injection patterns.
   */
  private checkStringForInjection(value: string, location?: SecurityIssue['location']): void {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        this.addIssue({
          code: 'SEC401',
          message: `Suspicious string content matches injection pattern`,
          severity: 'high',
          category: 'injection',
          location,
          suggestion: 'Review and sanitize the string content',
          snippet: value.substring(0, 100) + (value.length > 100 ? '...' : ''),
        });
        break; // Only report once per string
      }
    }
  }
  
  /**
   * Checks loop constructs.
   */
  private checkLoop(loop: AST.ForStatement | AST.WhileStatement): void {
    this.nestingDepth++;
    
    // Check for potentially infinite loops
    if (loop.kind === 'WhileStatement') {
      if (loop.condition.kind === 'BooleanLiteral' && loop.condition.value === true) {
        this.addIssue({
          code: 'SEC500',
          message: 'Infinite loop detected: while(true)',
          severity: 'high',
          category: 'denial-of-service',
          location: this.getLocation(loop),
          suggestion: 'Add a break condition or use a bounded loop',
        });
      }
    }
    
    // Check nesting
    if (this.nestingDepth > this.options.maxComplexity.maxNestingDepth) {
      this.addIssue({
        code: 'SEC501',
        message: `Loop nesting too deep (${this.nestingDepth} levels)`,
        severity: 'medium',
        category: 'resource',
        location: this.getLocation(loop),
        suggestion: 'Reduce loop nesting by extracting inner loops',
      });
    }
    
    this.checkNode(loop.body);
    this.nestingDepth--;
  }
  
  /**
   * Checks if statement.
   */
  private checkIfStatement(stmt: AST.IfStatement): void {
    this.nestingDepth++;
    this.checkNode(stmt.condition);
    this.checkNode(stmt.consequent);
    if (stmt.alternate) {
      this.checkNode(stmt.alternate);
    }
    this.nestingDepth--;
  }
  
  /**
   * Checks block statement.
   */
  private checkBlockStatement(block: AST.BlockStatement): void {
    for (const stmt of block.body) {
      this.checkNode(stmt);
    }
  }
  
  /**
   * Checks object literal.
   */
  private checkObjectLiteral(obj: AST.ObjectLiteral): void {
    // Check object size
    if (obj.properties.length > this.options.maxComplexity.maxObjectKeys) {
      this.addIssue({
        code: 'SEC600',
        message: `Object has too many keys (${obj.properties.length})`,
        severity: 'low',
        category: 'resource',
        location: this.getLocation(obj),
        suggestion: `Limit objects to ${this.options.maxComplexity.maxObjectKeys} keys`,
      });
    }
    
    // Check for prototype pollution in keys
    for (const prop of obj.properties) {
      const key = typeof prop.key === 'string' ? prop.key :
        prop.key.kind === 'StringLiteral' ? prop.key.value :
        prop.key.kind === 'Identifier' ? prop.key.name : null;
      
      if (key && PROTOTYPE_POLLUTION_PROPS.has(key)) {
        this.addIssue({
          code: 'SEC601',
          message: `Prototype pollution risk: object key "${key}"`,
          severity: 'critical',
          category: 'prototype',
          location: this.getLocation(obj),
          suggestion: `Do not use "${key}" as an object key`,
        });
      }
      
      this.checkNode(prop.value);
    }
  }
  
  /**
   * Checks array literal.
   */
  private checkArrayLiteral(arr: AST.ArrayLiteral): void {
    if (arr.elements.length > this.options.maxComplexity.maxArrayLength) {
      this.addIssue({
        code: 'SEC700',
        message: `Array exceeds maximum length (${arr.elements.length})`,
        severity: 'medium',
        category: 'resource',
        location: this.getLocation(arr),
        suggestion: `Keep arrays under ${this.options.maxComplexity.maxArrayLength} elements`,
      });
    }
    
    for (const el of arr.elements) {
      this.checkNode(el);
    }
  }
  
  /**
   * Checks assignment expressions.
   */
  private checkAssignment(assign: AST.AssignmentExpression): void {
    // Check for assignment to dangerous properties
    if (assign.target.kind === 'MemberExpression') {
      const prop = assign.target.property;
      if (PROTOTYPE_POLLUTION_PROPS.has(prop)) {
        this.addIssue({
          code: 'SEC800',
          message: `Prototype pollution: assignment to "${prop}"`,
          severity: 'critical',
          category: 'prototype',
          location: this.getLocation(assign),
          suggestion: `Do not assign to "${prop}"`,
        });
      }
    }
    
    this.checkNode(assign.target);
    this.checkNode(assign.value);
  }
  
  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------
  
  /**
   * Gets the name of a callee.
   */
  private getCalleeName(callee: AST.Expression): string {
    if (callee.kind === 'Identifier') {
      return callee.name;
    }
    if (callee.kind === 'MemberExpression') {
      const obj = this.getCalleeName(callee.object);
      return `${obj}.${callee.property}`;
    }
    return '';
  }
  
  /**
   * Checks if a name is suspicious.
   */
  private isSuspiciousName(name: string): boolean {
    // Check for common injection patterns in names
    if (/[<>'"&;]/.test(name)) return true;
    if (/__(proto|defineGetter|defineSetter)__/i.test(name)) return true;
    if (/constructor|prototype/i.test(name)) return true;
    return false;
  }
  
  /**
   * Checks if expression is string concatenation.
   */
  private isStringConcatenation(expr: AST.BinaryExpression): boolean {
    return expr.operator === '+' && (
      expr.left.kind === 'StringLiteral' ||
      expr.right.kind === 'StringLiteral' ||
      (expr.left.kind === 'BinaryExpression' && this.isStringConcatenation(expr.left)) ||
      (expr.right.kind === 'BinaryExpression' && this.isStringConcatenation(expr.right))
    );
  }
  
  /**
   * Gets source location from AST node.
   */
  private getLocation(node: AST.ASTNode): SecurityIssue['location'] | undefined {
    if ('span' in node && node.span) {
      const loc: { line: number; column: number; file?: string } = {
        line: node.span.start.line,
        column: node.span.start.column,
      };
      if (node.span.file !== undefined) {
        loc.file = node.span.file;
      }
      return loc;
    }
    return undefined;
  }
  
  /**
   * Adds a security issue.
   */
  private addIssue(issue: Omit<SecurityIssue, 'code' | 'location'> & { code: string; location?: SecurityIssue['location'] }): void {
    // Build issue object, only including location if defined
    const finalIssue: SecurityIssue = {
      code: issue.code,
      message: issue.message,
      severity: issue.severity,
      category: issue.category,
      ...(issue.location !== undefined ? { location: issue.location } : {}),
      ...(issue.suggestion !== undefined ? { suggestion: issue.suggestion } : {}),
      ...(issue.snippet !== undefined ? { snippet: issue.snippet } : {}),
    };
    this.issues.push(finalIssue);
  }
}

// ============================================================================
// SECURITY CHECKER OPTIONS
// ============================================================================

/**
 * Options for security checker.
 */
export interface SecurityCheckerOptions {
  /** Allow dangerous functions like eval */
  allowDangerousFunctions: boolean;
  /** Allow access to global objects like window */
  allowGlobalAccess: boolean;
  /** Allow prototype property access */
  allowPrototypeAccess: boolean;
  /** Allow dynamic/computed property access */
  allowDynamicPropertyAccess: boolean;
  /** Complexity limits */
  maxComplexity: typeof COMPLEXITY_LIMITS;
  /** Additional identifiers to block */
  customBlocklist: string[];
  /** Identifiers to allow (overrides blocklist) */
  customAllowlist: string[];
}

// ============================================================================
// RAW SOURCE VALIDATION
// ============================================================================

/**
 * Validates raw CardScript source code before parsing.
 * This catches issues that might slip through the AST analysis.
 */
export function validateSource(source: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = source.split('\n');
  
  // Check for dangerous patterns in raw source
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;
    
    // Check for hex/unicode escape sequences that could hide payloads
    if (/\\x[0-9a-f]{2}/i.test(line)) {
      issues.push({
        code: 'SRC001',
        message: 'Hex escape sequence detected - could hide malicious content',
        severity: 'medium',
        category: 'injection',
        location: { line: lineNum, column: line.search(/\\x/i) + 1 },
        snippet: line.trim().substring(0, 80),
      });
    }
    
    // Check for suspicious URL patterns
    if (/(?:javascript|data|vbscript):/i.test(line)) {
      issues.push({
        code: 'SRC002',
        message: 'Suspicious URL scheme detected',
        severity: 'high',
        category: 'injection',
        location: { line: lineNum, column: 1 },
        snippet: line.trim().substring(0, 80),
      });
    }
    
    // Check for excessively long lines (could indicate obfuscation)
    if (line.length > 5000) {
      issues.push({
        code: 'SRC003',
        message: `Excessively long line (${line.length} chars) - possible obfuscation`,
        severity: 'low',
        category: 'denial-of-service',
        location: { line: lineNum, column: 1 },
      });
    }
    
    // Check for null bytes
    if (line.includes('\0')) {
      issues.push({
        code: 'SRC004',
        message: 'Null byte detected - could indicate injection attempt',
        severity: 'critical',
        category: 'injection',
        location: { line: lineNum, column: line.indexOf('\0') + 1 },
      });
    }
  }
  
  // Check overall file size
  if (source.length > 10_000_000) { // 10MB
    issues.push({
      code: 'SRC005',
      message: `Source file too large (${(source.length / 1_000_000).toFixed(2)}MB)`,
      severity: 'high',
      category: 'denial-of-service',
    });
  }
  
  return issues;
}

// ============================================================================
// COMBINED VALIDATION
// ============================================================================

/**
 * Full security validation pipeline.
 */
export function validateSecurity(
  source: string,
  ast: AST.Program,
  options?: Partial<SecurityCheckerOptions>
): SecurityValidationResult {
  // First check raw source
  const sourceIssues = validateSource(source);
  
  // Then check AST
  const checker = new SecurityChecker(options);
  const astResult = checker.check(ast);
  
  // Combine results
  const allIssues = [...sourceIssues, ...astResult.issues];
  const critical = allIssues.filter(i => i.severity === 'critical');
  const high = allIssues.filter(i => i.severity === 'high');
  const medium = allIssues.filter(i => i.severity === 'medium');
  const low = allIssues.filter(i => i.severity === 'low');
  const info = allIssues.filter(i => i.severity === 'info');
  
  const bySeverity: Record<SecuritySeverity, number> = {
    critical: critical.length,
    high: high.length,
    medium: medium.length,
    low: low.length,
    info: info.length,
  };
  
  const byCategory: Partial<Record<SecurityCategory, number>> = {};
  for (const issue of allIssues) {
    byCategory[issue.category] = (byCategory[issue.category] ?? 0) + 1;
  }
  
  return {
    passed: critical.length === 0,
    issues: allIssues,
    critical,
    high,
    medium,
    low,
    info,
    stats: {
      total: allIssues.length,
      bySeverity,
      byCategory,
    },
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Creates a security checker with default options.
 */
export function createSecurityChecker(options?: Partial<SecurityCheckerOptions>): SecurityChecker {
  return new SecurityChecker(options);
}

/**
 * Quick security check - returns true if code passes.
 */
export function isSecure(source: string, ast: AST.Program): boolean {
  return validateSecurity(source, ast).passed;
}

/**
 * Gets a formatted report of security issues.
 */
export function formatSecurityReport(result: SecurityValidationResult): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('                    CARDSCRIPT SECURITY REPORT                      ');
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
  lines.push(`Total Issues: ${result.stats.total}`);
  lines.push('');
  lines.push('By Severity:');
  lines.push(`  Critical: ${result.stats.bySeverity.critical}`);
  lines.push(`  High:     ${result.stats.bySeverity.high}`);
  lines.push(`  Medium:   ${result.stats.bySeverity.medium}`);
  lines.push(`  Low:      ${result.stats.bySeverity.low}`);
  lines.push(`  Info:     ${result.stats.bySeverity.info}`);
  lines.push('');
  
  if (result.issues.length > 0) {
    lines.push('───────────────────────────────────────────────────────────────────');
    lines.push('Issues:');
    lines.push('');
    
    for (const issue of result.issues) {
      const loc = issue.location 
        ? `[${issue.location.line}:${issue.location.column}]` 
        : '';
      const sev = issue.severity.toUpperCase().padEnd(8);
      lines.push(`  ${sev} ${issue.code} ${loc}`);
      lines.push(`           ${issue.message}`);
      if (issue.suggestion) {
        lines.push(`           💡 ${issue.suggestion}`);
      }
      if (issue.snippet) {
        lines.push(`           📝 ${issue.snippet}`);
      }
      lines.push('');
    }
  }
  
  lines.push('═══════════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}
