/**
 * @fileoverview CardScript Friendly Error Messages.
 * 
 * Provides user-friendly, actionable error messages for CardScript compilation
 * and runtime errors. Designed to help beginners and provide context for 
 * experienced users.
 * 
 * Features:
 * - Human-readable error messages with plain English descriptions
 * - Code snippets with error highlighting
 * - Suggestions for fixing common mistakes
 * - Links to documentation (when available)
 * - Stack traces with source locations
 * 
 * @module @cardplay/user-cards/cardscript/errors
 */

import type { SourceSpan } from './grammar';
import type { ASTNode } from './ast';

// ============================================================================
// ERROR CATEGORIES
// ============================================================================

/**
 * Categories of errors for grouping and filtering.
 */
export type ErrorCategory =
  | 'syntax'      // Parsing errors (missing tokens, invalid syntax)
  | 'type'        // Type checking errors (type mismatch, unknown type)
  | 'reference'   // Reference errors (undefined variable, unknown function)
  | 'semantic'    // Semantic errors (invalid operation, unreachable code)
  | 'runtime'     // Runtime errors (division by zero, null access)
  | 'resource'    // Resource errors (file not found, module not found)
  | 'security'    // Security errors (sandbox violation, forbidden operation)
  | 'deprecated'  // Deprecation warnings
  | 'style'       // Style warnings (naming conventions, best practices)
  | 'performance' // Performance warnings (inefficient patterns)
  ;

/**
 * Severity levels for errors and warnings.
 */
export type ErrorSeverity =
  | 'error'    // Compilation fails
  | 'warning'  // Compilation succeeds but may have issues
  | 'info'     // Informational message
  | 'hint'     // Suggestion for improvement
  ;

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Error codes for programmatic handling.
 * Format: E[category][number]
 * - ES = Syntax
 * - ET = Type
 * - ER = Reference
 * - EM = Semantic
 * - EX = Runtime
 * - EF = Resource (File)
 * - EZ = Security
 * - WD = Warning Deprecated
 * - WS = Warning Style
 * - WP = Warning Performance
 */
export type ErrorCode =
  // Syntax errors (ES001-ES099)
  | 'ES001' // Unexpected token
  | 'ES002' // Missing semicolon
  | 'ES003' // Missing closing bracket
  | 'ES004' // Missing closing parenthesis
  | 'ES005' // Missing closing brace
  | 'ES006' // Invalid number literal
  | 'ES007' // Invalid string literal (unclosed)
  | 'ES008' // Invalid identifier
  | 'ES009' // Reserved keyword used as identifier
  | 'ES010' // Unexpected end of input
  | 'ES011' // Invalid escape sequence
  | 'ES012' // Missing expression
  | 'ES013' // Invalid assignment target
  | 'ES014' // Missing arrow (=>) in function
  | 'ES015' // Invalid parameter declaration
  | 'ES016' // Duplicate parameter name
  | 'ES017' // Invalid spread syntax
  | 'ES018' // Invalid destructuring pattern
  | 'ES019' // Missing colon in object literal
  | 'ES020' // Trailing comma not allowed
  
  // Type errors (ET001-ET099)
  | 'ET001' // Type mismatch
  | 'ET002' // Unknown type
  | 'ET003' // Type inference failed
  | 'ET004' // Generic type argument missing
  | 'ET005' // Too many type arguments
  | 'ET006' // Type not assignable
  | 'ET007' // Property does not exist on type
  | 'ET008' // Index signature missing
  | 'ET009' // Cannot invoke non-function
  | 'ET010' // Cannot index non-array
  | 'ET011' // Union type requires type guard
  | 'ET012' // Optional chaining on non-optional
  | 'ET013' // Null/undefined not allowed
  | 'ET014' // Circular type reference
  | 'ET015' // Incompatible function signatures
  | 'ET016' // Missing return type
  | 'ET017' // Void function returns value
  | 'ET018' // Non-void function missing return
  | 'ET019' // Invalid type cast
  | 'ET020' // Type parameter constraint violation
  
  // Reference errors (ER001-ER099)
  | 'ER001' // Undefined variable
  | 'ER002' // Undefined function
  | 'ER003' // Undefined type
  | 'ER004' // Undefined card
  | 'ER005' // Undefined module
  | 'ER006' // Undefined property
  | 'ER007' // Variable used before declaration
  | 'ER008' // Cannot reassign constant
  | 'ER009' // Import not found
  | 'ER010' // Export not found
  | 'ER011' // Circular import
  | 'ER012' // Ambiguous import (multiple matches)
  | 'ER013' // Private member access
  | 'ER014' // Undefined preset
  | 'ER015' // Undefined parameter
  
  // Semantic errors (EM001-EM099)
  | 'EM001' // Unreachable code
  | 'EM002' // Missing await
  | 'EM003' // await outside async
  | 'EM004' // return outside function
  | 'EM005' // break outside loop
  | 'EM006' // continue outside loop
  | 'EM007' // Duplicate declaration
  | 'EM008' // Invalid left-hand side
  | 'EM009' // Missing card signature
  | 'EM010' // Invalid port type
  | 'EM011' // Invalid param type
  | 'EM012' // Process function required
  | 'EM013' // Invalid card category
  | 'EM014' // Duplicate export
  | 'EM015' // Default export already exists
  | 'EM016' // Invalid spread in this context
  | 'EM017' // Async generator not supported
  | 'EM018' // Yield outside generator
  | 'EM019' // Invalid decorator usage
  | 'EM020' // Missing required parameter
  
  // Runtime errors (EX001-EX099)
  | 'EX001' // Division by zero
  | 'EX002' // Null pointer access
  | 'EX003' // Array index out of bounds
  | 'EX004' // Stack overflow
  | 'EX005' // Out of memory
  | 'EX006' // Timeout exceeded
  | 'EX007' // Assertion failed
  | 'EX008' // Invalid operation
  | 'EX009' // Type error at runtime
  | 'EX010' // Module initialization failed
  
  // Resource errors (EF001-EF099)
  | 'EF001' // File not found
  | 'EF002' // Module not found
  | 'EF003' // Permission denied
  | 'EF004' // Invalid path
  | 'EF005' // Resource limit exceeded
  | 'EF006' // Network error
  | 'EF007' // Invalid JSON
  | 'EF008' // Invalid module format
  | 'EF009' // Version mismatch
  | 'EF010' // Dependency resolution failed
  
  // Security errors (EZ001-EZ099)
  | 'EZ001' // Forbidden function call
  | 'EZ002' // Global variable access
  | 'EZ003' // Prototype manipulation
  | 'EZ004' // Eval/Function constructor
  | 'EZ005' // Infinite loop detected
  | 'EZ006' // Excessive memory allocation
  | 'EZ007' // Suspicious code pattern
  | 'EZ008' // Sandbox escape attempt
  | 'EZ009' // Forbidden import
  | 'EZ010' // Resource exhaustion
  
  // Deprecation warnings (WD001-WD099)
  | 'WD001' // Deprecated function
  | 'WD002' // Deprecated type
  | 'WD003' // Deprecated parameter
  | 'WD004' // Deprecated card
  | 'WD005' // Deprecated module
  
  // Style warnings (WS001-WS099)
  | 'WS001' // Non-standard naming
  | 'WS002' // Unused variable
  | 'WS003' // Unused import
  | 'WS004' // Implicit any type
  | 'WS005' // Prefer const over let
  | 'WS006' // Empty block
  | 'WS007' // Debugger statement
  | 'WS008' // Console statement
  | 'WS009' // TODO/FIXME comment
  | 'WS010' // Magic number
  
  // Performance warnings (WP001-WP099)
  | 'WP001' // Allocation in process loop
  | 'WP002' // Closure in hot path
  | 'WP003' // Array copy instead of view
  | 'WP004' // Sync operation in async
  | 'WP005' // Inefficient string concat
  | 'WP006' // Unnecessary type conversion
  | 'WP007' // Large object copy
  | 'WP008' // Repeated computation
  | 'WP009' // Missing early return
  | 'WP010' // Excessive recursion depth
  ;

// ============================================================================
// ERROR MESSAGE TEMPLATES
// ============================================================================

/**
 * Error message template with placeholders.
 */
interface ErrorTemplate {
  /** Short, one-line summary */
  summary: string;
  /** Detailed explanation */
  detail: string;
  /** Suggestions for fixing */
  suggestions: string[];
  /** Example of correct code (if applicable) */
  example?: string;
  /** Related documentation link */
  docsUrl?: string;
}

/**
 * Error message templates for all error codes.
 */
const ERROR_TEMPLATES: Record<ErrorCode, ErrorTemplate> = {
  // Syntax errors
  ES001: {
    summary: 'Unexpected token "{token}"',
    detail: 'The parser encountered a token that doesn\'t make sense in this context. This usually means there\'s a typo or a missing operator.',
    suggestions: [
      'Check for typos in the line',
      'Make sure all operators are complete (e.g., "==" not "=")',
      'Check if you\'re missing a comma, semicolon, or bracket',
    ],
    example: '// Instead of:\nlet x = 5 +\n\n// Write:\nlet x = 5 + 3;',
  },
  ES002: {
    summary: 'Missing semicolon',
    detail: 'A semicolon is expected after this statement. While CardScript can often infer where statements end, explicit semicolons help avoid ambiguity.',
    suggestions: [
      'Add a semicolon at the end of the statement',
      'If you intended to continue the expression on the next line, use a backslash (\\) or parentheses',
    ],
    example: '// Instead of:\nlet x = 5\nlet y = 10\n\n// Write:\nlet x = 5;\nlet y = 10;',
  },
  ES003: {
    summary: 'Missing closing bracket "]"',
    detail: 'An opening bracket "[" was found but no matching closing bracket "]". This usually means an array literal or index access is incomplete.',
    suggestions: [
      'Add the missing "]" to close the array',
      'Check if you have nested brackets and count them',
      'Use an editor with bracket matching to find the mismatch',
    ],
    example: '// Instead of:\nlet arr = [1, 2, 3\n\n// Write:\nlet arr = [1, 2, 3];',
  },
  ES004: {
    summary: 'Missing closing parenthesis ")"',
    detail: 'An opening parenthesis "(" was found but no matching closing parenthesis ")". This usually means a function call or grouping expression is incomplete.',
    suggestions: [
      'Add the missing ")" to close the expression',
      'Check for nested parentheses and count them',
      'Use an editor with bracket matching',
    ],
    example: '// Instead of:\nlet result = foo(1, 2\n\n// Write:\nlet result = foo(1, 2);',
  },
  ES005: {
    summary: 'Missing closing brace "}"',
    detail: 'An opening brace "{" was found but no matching closing brace "}". This usually means a block, object literal, or function body is incomplete.',
    suggestions: [
      'Add the missing "}" to close the block',
      'Check if you have nested braces and count them',
      'Make sure every function, if, for, and while has matching braces',
    ],
    example: '// Instead of:\nfunction foo() {\n  return 5;\n\n// Write:\nfunction foo() {\n  return 5;\n}',
  },
  ES006: {
    summary: 'Invalid number literal',
    detail: 'The number "{value}" couldn\'t be parsed. Numbers should be integers, decimals, or use scientific notation.',
    suggestions: [
      'Make sure the number has at most one decimal point',
      'Check for invalid characters in the number',
      'Use valid scientific notation (e.g., 1e10, 1.5e-3)',
    ],
    example: '// Valid numbers:\n42\n3.14\n1e10\n0xFF // hex\n0b1010 // binary',
  },
  ES007: {
    summary: 'Unterminated string literal',
    detail: 'A string was started with a quote but never closed. Every string must end with the same type of quote it started with.',
    suggestions: [
      'Add the closing quote at the end of the string',
      'If your string contains quotes, escape them with backslash',
      'For multi-line strings, use template literals with backticks',
    ],
    example: '// Instead of:\nlet s = "hello\n\n// Write:\nlet s = "hello";\n// Or for multi-line:\nlet s = `hello\nworld`;',
  },
  ES008: {
    summary: 'Invalid identifier "{name}"',
    detail: 'Identifiers (variable names, function names) must start with a letter, underscore, or dollar sign, and can only contain letters, numbers, underscores, and dollar signs.',
    suggestions: [
      'Start the name with a letter or underscore',
      'Remove any special characters',
      'Use camelCase for multi-word names',
    ],
    example: '// Invalid: 123abc, my-var, @value\n// Valid: myVar, _private, $element, value123',
  },
  ES009: {
    summary: 'Cannot use reserved keyword "{keyword}" as identifier',
    detail: 'The word "{keyword}" is a reserved keyword in CardScript and cannot be used as a variable, function, or type name.',
    suggestions: [
      'Choose a different name that isn\'t a keyword',
      'Add a prefix or suffix to make it unique',
      'Common keywords: let, const, function, if, else, for, while, return, etc.',
    ],
    example: '// Instead of:\nlet function = 5;\n\n// Write:\nlet myFunction = 5;\nlet funcValue = 5;',
  },
  ES010: {
    summary: 'Unexpected end of input',
    detail: 'The file ended unexpectedly. This usually means an expression, block, or statement is incomplete.',
    suggestions: [
      'Check for missing closing brackets, braces, or parentheses',
      'Make sure all statements are complete',
      'Look for unclosed strings or comments',
    ],
    example: 'Make sure every { has a matching }',
  },
  ES011: {
    summary: 'Invalid escape sequence "\\{char}"',
    detail: 'The escape sequence "\\{char}" is not recognized. Valid escape sequences include \\n, \\t, \\r, \\\\, \\", \\\', and \\uXXXX.',
    suggestions: [
      'Use a valid escape sequence',
      'If you want a literal backslash, use \\\\',
      'For Unicode characters, use \\uXXXX format',
    ],
    example: '// Valid escapes:\n"line1\\nline2"  // newline\n"tab\\there"     // tab\n"quote: \\\""   // quote\n"backslash: \\\\" // backslash',
  },
  ES012: {
    summary: 'Missing expression',
    detail: 'An expression was expected but not found. This usually happens after an operator or at the start of a statement.',
    suggestions: [
      'Add the missing expression',
      'Remove the trailing operator if it\'s not needed',
      'Check for accidental empty parentheses',
    ],
    example: '// Instead of:\nlet x = ;\n\n// Write:\nlet x = 5;',
  },
  ES013: {
    summary: 'Invalid assignment target',
    detail: 'The left-hand side of an assignment must be a variable, property access, or destructuring pattern. You can\'t assign to literals or expressions.',
    suggestions: [
      'Make sure you\'re assigning to a variable name',
      'If comparing, use == or === instead of =',
      'For destructuring, use valid patterns',
    ],
    example: '// Invalid: 5 = x, (a + b) = c\n// Valid: x = 5, obj.prop = value, [a, b] = arr',
  },
  ES014: {
    summary: 'Missing arrow "=>" in function',
    detail: 'Arrow functions require "=>" between the parameters and the body.',
    suggestions: [
      'Add "=>" after the parameter list',
      'For traditional functions, use the "function" keyword',
    ],
    example: '// Arrow function:\nconst add = (a, b) => a + b;\n\n// Traditional function:\nfunction add(a, b) { return a + b; }',
  },
  ES015: {
    summary: 'Invalid parameter declaration',
    detail: 'Function parameters must be valid identifiers, optionally with type annotations and default values.',
    suggestions: [
      'Use valid identifier names for parameters',
      'Put default values after the type annotation',
      'Use rest parameter (...args) only as the last parameter',
    ],
    example: '// Valid:\nfunction foo(x: number, y = 10, ...rest: number[]) {}',
  },
  ES016: {
    summary: 'Duplicate parameter name "{name}"',
    detail: 'Each parameter in a function must have a unique name. The parameter "{name}" is defined more than once.',
    suggestions: [
      'Rename one of the duplicate parameters',
      'If they\'re meant to be different, give them descriptive names',
    ],
    example: '// Instead of:\nfunction foo(x, x) {}\n\n// Write:\nfunction foo(x1, x2) {}',
  },
  ES017: {
    summary: 'Invalid spread syntax',
    detail: 'The spread operator (...) can only be used in specific contexts: array literals, function calls, and destructuring patterns.',
    suggestions: [
      'Make sure the spread is inside an array or function call',
      'For object spread, use { ...obj }',
      'Rest parameters must be the last parameter',
    ],
    example: '// Valid uses:\n[...arr1, ...arr2]\nfoo(...args)\n{ ...obj1, ...obj2 }',
  },
  ES018: {
    summary: 'Invalid destructuring pattern',
    detail: 'Destructuring patterns must match the structure of the value being destructured. Object patterns use braces, array patterns use brackets.',
    suggestions: [
      'Match the pattern to the value structure',
      'Use default values with =',
      'Rename properties with :',
    ],
    example: '// Object: const { a, b: renamed, c = 5 } = obj;\n// Array: const [first, second, ...rest] = arr;',
  },
  ES019: {
    summary: 'Missing colon in object literal',
    detail: 'Object properties must be separated from their values by a colon (:).',
    suggestions: [
      'Add a colon between the property name and value',
      'For shorthand properties, just use the variable name',
    ],
    example: '// Instead of:\n{ name "Alice" }\n\n// Write:\n{ name: "Alice" }\n// Or shorthand:\n{ name }  // same as { name: name }',
  },
  ES020: {
    summary: 'Trailing comma not allowed',
    detail: 'A trailing comma is not allowed in this context.',
    suggestions: [
      'Remove the trailing comma',
      'If you need another element, add it after the comma',
    ],
    example: '// Remove trailing comma:\n[1, 2, 3]\n{ a: 1, b: 2 }',
  },
  
  // Type errors
  ET001: {
    summary: 'Type mismatch: expected "{expected}", got "{actual}"',
    detail: 'The value provided has a different type than expected. CardScript is statically typed, so types must match at compile time.',
    suggestions: [
      'Check the expected type from the function signature',
      'Convert the value to the correct type if needed',
      'If the value might be multiple types, use a union type',
    ],
    example: '// If expecting number but got string:\nconst x: number = parseInt(someString);\n// Or fix the type:\nconst x: string = someString;',
  },
  ET002: {
    summary: 'Unknown type "{type}"',
    detail: 'The type "{type}" hasn\'t been defined. Make sure to import or define custom types before using them.',
    suggestions: [
      'Check the spelling of the type name',
      'Import the type if it\'s from another module',
      'Define the type if it\'s custom',
    ],
    example: '// Define a custom type:\ntype MyType = { name: string; value: number };\n\n// Or import:\nimport { MyType } from "./types";',
  },
  ET003: {
    summary: 'Type inference failed',
    detail: 'CardScript couldn\'t automatically determine the type of this expression. This usually happens with complex expressions or empty collections.',
    suggestions: [
      'Add an explicit type annotation',
      'Provide initial values to help inference',
      'For empty arrays, use: [] as Type[]',
    ],
    example: '// Add type annotation:\nconst arr: number[] = [];\nconst fn: (x: number) => number = (x) => x * 2;',
  },
  ET004: {
    summary: 'Generic type "{type}" requires type argument(s)',
    detail: 'Generic types need type parameters to be complete. For example, Array needs to know what type of elements it holds.',
    suggestions: [
      'Add the type argument(s) in angle brackets',
      'Use shorthand where available (e.g., number[] instead of Array<number>)',
    ],
    example: '// Instead of:\nlet arr: Array;\n\n// Write:\nlet arr: Array<number>;\n// Or:\nlet arr: number[];',
  },
  ET005: {
    summary: 'Too many type arguments for "{type}"',
    detail: 'The generic type "{type}" expects {expected} type argument(s), but {actual} were provided.',
    suggestions: [
      'Remove the extra type arguments',
      'Check the type definition for the correct number',
    ],
  },
  ET006: {
    summary: 'Type "{source}" is not assignable to type "{target}"',
    detail: 'The value has a type that cannot be assigned to the target. Even if the values might be compatible at runtime, the types must be compatible at compile time.',
    suggestions: [
      'Check if the types are actually compatible',
      'Use a type assertion if you\'re sure (as Type)',
      'Add a type guard to narrow the type',
    ],
    example: '// Type assertion (use with caution):\nconst x = value as number;\n\n// Type guard:\nif (typeof value === "number") {\n  const x: number = value; // OK\n}',
  },
  ET007: {
    summary: 'Property "{property}" does not exist on type "{type}"',
    detail: 'You\'re trying to access a property that doesn\'t exist on this type. This could be a typo or the type might need to be updated.',
    suggestions: [
      'Check the spelling of the property name',
      'Check if the property exists on the type definition',
      'Use optional chaining (obj?.prop) if the property might not exist',
    ],
    example: '// Check available properties:\ntype Person = { name: string; age: number };\nlet p: Person;\np.name; // OK\np.nam;  // Error: did you mean "name"?',
  },
  ET008: {
    summary: 'Type "{type}" has no index signature',
    detail: 'You\'re trying to index into a type that doesn\'t support indexing. Only arrays, tuples, and objects with index signatures can be indexed.',
    suggestions: [
      'Use a property access instead of indexing',
      'Add an index signature to the type',
      'Use a Map if you need dynamic keys',
    ],
    example: '// For dynamic keys, use index signature:\ntype Dict = { [key: string]: number };\n// Or use Map:\nconst map = new Map<string, number>();',
  },
  ET009: {
    summary: 'Cannot invoke expression of type "{type}"',
    detail: 'You\'re trying to call something that isn\'t a function. Only functions and callable objects can be invoked with ().',
    suggestions: [
      'Check if the value is actually a function',
      'If it\'s an object with a call method, invoke that method',
      'Check for typos in the function name',
    ],
  },
  ET010: {
    summary: 'Cannot index type "{type}" with "{index}"',
    detail: 'The indexing operation isn\'t valid for this type. Arrays need numeric indices, objects need string keys.',
    suggestions: [
      'Use the correct index type for the collection',
      'For arrays, use numbers: arr[0]',
      'For objects, use strings: obj["key"] or obj.key',
    ],
  },
  ET011: {
    summary: 'Union type "{type}" needs type narrowing',
    detail: 'This value could be one of several types. You need to narrow it down with a type guard before using type-specific operations.',
    suggestions: [
      'Use typeof for primitive types',
      'Use instanceof for class instances',
      'Use "in" operator for property checks',
      'Use a discriminated union with a type field',
    ],
    example: '// Narrow with typeof:\nif (typeof value === "string") {\n  // value is string here\n  console.log(value.length);\n}',
  },
  ET012: {
    summary: 'Optional chaining not needed on non-optional type',
    detail: 'The ?. operator is for accessing properties that might be null or undefined. This value is guaranteed to exist.',
    suggestions: [
      'Remove the ? and use regular property access',
      'Or update the type to include undefined if it might be missing',
    ],
    example: '// Instead of:\nobj?.prop  // when obj is always defined\n\n// Write:\nobj.prop',
  },
  ET013: {
    summary: '"{type}" is possibly null or undefined',
    detail: 'This value might be null or undefined, but you\'re using it as if it\'s guaranteed to exist. This could cause a runtime error.',
    suggestions: [
      'Add a null check before using the value',
      'Use optional chaining (?.)',
      'Use nullish coalescing (??) to provide a default',
      'Use non-null assertion (!) if you\'re sure it exists',
    ],
    example: '// Null check:\nif (value !== null) {\n  use(value);\n}\n\n// Default value:\nconst safe = value ?? defaultValue;',
  },
  ET014: {
    summary: 'Circular type reference detected',
    detail: 'The type definition references itself in a way that creates an infinite loop. Recursive types need a base case.',
    suggestions: [
      'Use interfaces for recursive types (they support circular references)',
      'Add a base case to break the recursion',
      'Use a union type with a terminating option',
    ],
    example: '// Use interface for recursive types:\ninterface TreeNode {\n  value: number;\n  children?: TreeNode[]; // Optional breaks the cycle\n}',
  },
  ET015: {
    summary: 'Function signature mismatch',
    detail: 'The function signature doesn\'t match what\'s expected. The parameters and return type must be compatible.',
    suggestions: [
      'Check the parameter types and count',
      'Check the return type',
      'Make sure optional parameters are marked correctly',
    ],
    example: '// Expected: (x: number) => string\n// Provided: (x: number) => number\n// Fix the return type',
  },
  ET016: {
    summary: 'Function is missing return type',
    detail: 'CardScript requires explicit return types for functions in certain contexts for better type safety.',
    suggestions: [
      'Add a return type annotation after the parameter list',
      'If the function doesn\'t return anything, use : void',
    ],
    example: 'function add(a: number, b: number): number {\n  return a + b;\n}',
  },
  ET017: {
    summary: 'Void function cannot return a value',
    detail: 'This function is declared to return void (nothing), but it has a return statement with a value.',
    suggestions: [
      'Remove the return value',
      'Change the return type if you need to return something',
    ],
    example: '// Instead of:\nfunction log(msg: string): void {\n  return true; // Error\n}\n\n// Write:\nfunction log(msg: string): void {\n  console.log(msg);\n  return; // OK, or just omit\n}',
  },
  ET018: {
    summary: 'Non-void function must return a value',
    detail: 'This function is declared to return {type}, but some code paths don\'t have a return statement.',
    suggestions: [
      'Add return statements to all code paths',
      'Change the return type to include undefined if not always returning',
      'Add a default return at the end',
    ],
    example: 'function getValue(cond: boolean): number {\n  if (cond) {\n    return 1;\n  }\n  // Need a return here!\n  return 0;\n}',
  },
  ET019: {
    summary: 'Invalid type cast from "{source}" to "{target}"',
    detail: 'This type assertion is unlikely to be correct. The source and target types are unrelated.',
    suggestions: [
      'Cast through unknown first if you\'re sure: value as unknown as Target',
      'Check if the types should actually be related',
      'Use a type guard instead of assertion',
    ],
  },
  ET020: {
    summary: 'Type "{type}" does not satisfy constraint "{constraint}"',
    detail: 'The type parameter must satisfy certain constraints, and the provided type doesn\'t meet them.',
    suggestions: [
      'Check the constraint definition',
      'Make sure your type includes all required properties',
      'Extend the base type if needed',
    ],
  },
  
  // Reference errors
  ER001: {
    summary: 'Variable "{name}" is not defined',
    detail: 'You\'re using a variable that hasn\'t been declared yet. Variables must be declared with let, const, or var before use.',
    suggestions: [
      'Check the spelling of the variable name',
      'Declare the variable before using it',
      'Import the variable if it\'s from another module',
      'Check if it\'s a typo of a similar variable',
    ],
    example: '// Declare before use:\nlet myVar = 5;\nconsole.log(myVar);',
  },
  ER002: {
    summary: 'Function "{name}" is not defined',
    detail: 'You\'re calling a function that hasn\'t been declared. Functions must be defined or imported before use.',
    suggestions: [
      'Check the spelling of the function name',
      'Import the function from the correct module',
      'Define the function before calling it',
    ],
    example: '// Define the function:\nfunction myFunc() { }\n\n// Or import it:\nimport { myFunc } from "./module";',
  },
  ER003: {
    summary: 'Type "{name}" is not defined',
    detail: 'You\'re using a type that hasn\'t been declared. Types must be defined with type/interface or imported.',
    suggestions: [
      'Check the spelling of the type name',
      'Import the type from the correct module',
      'Define the type before using it',
    ],
  },
  ER004: {
    summary: 'Card "{name}" is not registered',
    detail: 'You\'re trying to invoke a card that hasn\'t been registered. Cards must be registered before they can be used.',
    suggestions: [
      'Register the card with registerCard()',
      'Check the spelling of the card ID',
      'Import the card from the correct module',
    ],
    example: 'import { registerCard, invoke } from "@cardplay/cardscript";\n\nregisterCard(myCard);\nconst result = invoke("my-card", { gain: 0.5 });',
  },
  ER005: {
    summary: 'Module "{name}" not found',
    detail: 'The module couldn\'t be found. Check the import path and make sure the module exists.',
    suggestions: [
      'Check the spelling of the module path',
      'Make sure the file exists at the specified location',
      'Use relative paths for local modules (./module)',
      'Check your module resolution settings',
    ],
    example: '// Relative import:\nimport { foo } from "./utils";\n\n// Package import:\nimport { bar } from "@cardplay/effects";',
  },
  ER006: {
    summary: 'Property "{property}" not found on "{object}"',
    detail: 'You\'re accessing a property that doesn\'t exist on this object.',
    suggestions: [
      'Check the spelling of the property name',
      'Check what properties are available on the object',
      'Use optional chaining if the property might not exist',
    ],
  },
  ER007: {
    summary: 'Variable "{name}" used before declaration',
    detail: 'You\'re using a variable before it\'s declared. In CardScript, variables declared with let/const are not hoisted.',
    suggestions: [
      'Move the variable declaration before its usage',
      'If you need hoisting, use function declarations',
    ],
    example: '// Error:\nconsole.log(x);\nlet x = 5;\n\n// Fixed:\nlet x = 5;\nconsole.log(x);',
  },
  ER008: {
    summary: 'Cannot reassign constant "{name}"',
    detail: 'Variables declared with const cannot be reassigned. They\'re constant throughout their scope.',
    suggestions: [
      'Use let instead of const if you need to reassign',
      'Create a new variable with a different name',
      'If it\'s an object/array, you can modify its contents (just not reassign)',
    ],
    example: '// Use let for reassignable:\nlet x = 5;\nx = 10; // OK\n\n// const for constants:\nconst y = 5;\ny = 10; // Error',
  },
  ER009: {
    summary: 'Import "{name}" not found in module "{module}"',
    detail: 'The module exists but doesn\'t export "{name}". Check the module\'s exports.',
    suggestions: [
      'Check the spelling of the import name',
      'Check what the module actually exports',
      'Use the default import if it\'s a default export',
    ],
    example: '// Named import:\nimport { foo } from "./module";\n\n// Default import:\nimport foo from "./module";',
  },
  ER010: {
    summary: 'Export "{name}" not found',
    detail: 'You\'re trying to export something that doesn\'t exist in the current scope.',
    suggestions: [
      'Check the spelling',
      'Make sure the item is declared before exporting',
      'Use export declaration: export const x = 5',
    ],
  },
  ER011: {
    summary: 'Circular import detected: {cycle}',
    detail: 'Modules are importing each other in a cycle. This can cause initialization issues.',
    suggestions: [
      'Refactor to break the cycle',
      'Move shared code to a separate module',
      'Use dynamic imports if needed',
    ],
  },
  ER012: {
    summary: 'Ambiguous import "{name}"',
    detail: 'Multiple modules export "{name}". Specify which one you want.',
    suggestions: [
      'Use aliased imports to disambiguate',
      'Import from a more specific path',
    ],
    example: 'import { foo as fooA } from "./moduleA";\nimport { foo as fooB } from "./moduleB";',
  },
  ER013: {
    summary: 'Cannot access private member "{name}"',
    detail: 'This member is private and can only be accessed within its class.',
    suggestions: [
      'Use a public method to access it',
      'Check if there\'s a getter for this value',
      'If you own the class, make it public if needed',
    ],
  },
  ER014: {
    summary: 'Preset "{name}" not found',
    detail: 'The preset hasn\'t been registered. Register presets before using them.',
    suggestions: [
      'Register the preset with registerPreset()',
      'Check the spelling of the preset name',
    ],
  },
  ER015: {
    summary: 'Parameter "{name}" not found on card',
    detail: 'The card doesn\'t have a parameter with this name.',
    suggestions: [
      'Check the spelling of the parameter name',
      'Check the card\'s parameter list',
    ],
  },
  
  // Semantic errors
  EM001: {
    summary: 'Unreachable code detected',
    detail: 'This code will never execute because there\'s an unconditional return, throw, or break before it.',
    suggestions: [
      'Remove the unreachable code',
      'Check if your control flow is correct',
      'This might indicate a logic error',
    ],
  },
  EM002: {
    summary: 'Missing await on Promise',
    detail: 'This async operation returns a Promise, but you\'re not awaiting it. The result will be a Promise, not the resolved value.',
    suggestions: [
      'Add await before the async call',
      'If intentional, use void to indicate you don\'t care about the result',
    ],
    example: '// Instead of:\nconst result = asyncFunc();\n\n// Write:\nconst result = await asyncFunc();',
  },
  EM003: {
    summary: 'await is only valid in async functions',
    detail: 'The await keyword can only be used inside functions marked as async.',
    suggestions: [
      'Mark the containing function as async',
      'Use .then() instead for non-async contexts',
    ],
    example: '// Make the function async:\nasync function foo() {\n  const result = await asyncFunc();\n}',
  },
  EM004: {
    summary: 'return statement outside function',
    detail: 'The return statement can only be used inside a function.',
    suggestions: [
      'Make sure return is inside a function body',
      'For module-level code, use export instead',
    ],
  },
  EM005: {
    summary: 'break statement outside loop or switch',
    detail: 'The break statement can only be used inside loops (for, while) or switch statements.',
    suggestions: [
      'Make sure break is inside a loop or switch',
      'Use return to exit a function instead',
    ],
  },
  EM006: {
    summary: 'continue statement outside loop',
    detail: 'The continue statement can only be used inside loops (for, while).',
    suggestions: [
      'Make sure continue is inside a loop',
      'Use an if statement to skip code instead',
    ],
  },
  EM007: {
    summary: 'Duplicate declaration of "{name}"',
    detail: 'The identifier "{name}" is already declared in this scope.',
    suggestions: [
      'Use a different name',
      'Remove the duplicate declaration',
      'If intentional, use different scopes',
    ],
  },
  EM008: {
    summary: 'Invalid left-hand side in assignment',
    detail: 'The left side of an assignment must be a variable or property that can be assigned to.',
    suggestions: [
      'Use a variable name on the left',
      'For comparison, use == or ===',
    ],
  },
  EM009: {
    summary: 'Card declaration missing signature',
    detail: 'Card declarations must include input/output port definitions.',
    suggestions: [
      'Add inputs array to define input ports',
      'Add outputs array to define output ports',
    ],
    example: 'card MyCard {\n  inputs: [{ name: "in", type: "audio" }],\n  outputs: [{ name: "out", type: "audio" }],\n  process: (input) => input\n}',
  },
  EM010: {
    summary: 'Invalid port type "{type}"',
    detail: 'Port types must be one of: audio, midi, events, control, number, string, boolean.',
    suggestions: [
      'Use a valid port type',
      'Register custom types if needed',
    ],
  },
  EM011: {
    summary: 'Invalid parameter type "{type}"',
    detail: 'Parameter types must be: number, string, boolean, or enum.',
    suggestions: [
      'Use a valid parameter type',
      'For complex types, use multiple simple parameters',
    ],
  },
  EM012: {
    summary: 'Card must have a process function',
    detail: 'Every card needs a process function that transforms input to output.',
    suggestions: [
      'Add a process field to the card',
      'The process function receives (input, context, state, params)',
    ],
  },
  EM013: {
    summary: 'Invalid card category "{category}"',
    detail: 'Card categories must be one of: generator, effect, transform, filter, router, utility, analyzer.',
    suggestions: [
      'Use a valid category',
      'Categories help organize cards in the UI',
    ],
  },
  EM014: {
    summary: 'Duplicate export "{name}"',
    detail: 'The identifier "{name}" is already exported from this module.',
    suggestions: [
      'Remove the duplicate export',
      'Rename one of the exports',
    ],
  },
  EM015: {
    summary: 'Default export already exists',
    detail: 'A module can only have one default export.',
    suggestions: [
      'Remove one of the default exports',
      'Convert one to a named export',
    ],
  },
  EM016: {
    summary: 'Spread not allowed in this context',
    detail: 'The spread operator can only be used in arrays, objects, and function arguments.',
    suggestions: [
      'Move the spread to a valid context',
      'Use a loop instead for non-spread contexts',
    ],
  },
  EM017: {
    summary: 'Async generators are not supported',
    detail: 'CardScript doesn\'t support async generators (async function*).',
    suggestions: [
      'Use async iterators instead',
      'Process items one at a time with async/await',
    ],
  },
  EM018: {
    summary: 'yield can only be used in generators',
    detail: 'The yield keyword is only valid inside generator functions (function*).',
    suggestions: [
      'Make the function a generator',
      'Use return instead for non-generators',
    ],
  },
  EM019: {
    summary: 'Invalid decorator usage',
    detail: 'Decorators can only be applied to classes and class members.',
    suggestions: [
      'Apply the decorator to a class or method',
      'Remove the decorator if not needed',
    ],
  },
  EM020: {
    summary: 'Missing required parameter "{name}"',
    detail: 'The parameter "{name}" is required but wasn\'t provided.',
    suggestions: [
      'Provide a value for the required parameter',
      'If it should be optional, add a default value in the definition',
    ],
  },
  
  // Runtime errors
  EX001: {
    summary: 'Division by zero',
    detail: 'Cannot divide by zero. Check that the divisor is not zero before dividing.',
    suggestions: [
      'Add a check before division: if (divisor !== 0)',
      'Use a default value: value / (divisor || 1)',
    ],
  },
  EX002: {
    summary: 'Cannot read property of null/undefined',
    detail: 'Tried to access a property on null or undefined.',
    suggestions: [
      'Add a null check before accessing',
      'Use optional chaining: obj?.prop',
      'Use nullish coalescing: obj ?? default',
    ],
  },
  EX003: {
    summary: 'Array index {index} out of bounds',
    detail: 'The array has {length} elements, but index {index} was accessed.',
    suggestions: [
      'Check the array length before accessing',
      'Use arr.at(-1) for last element',
      'Handle out-of-bounds gracefully',
    ],
  },
  EX004: {
    summary: 'Stack overflow: too much recursion',
    detail: 'The function called itself too many times without returning.',
    suggestions: [
      'Add a base case to stop recursion',
      'Convert recursion to iteration',
      'Check for infinite recursion in your logic',
    ],
  },
  EX005: {
    summary: 'Out of memory',
    detail: 'The operation used too much memory.',
    suggestions: [
      'Process data in smaller chunks',
      'Release references to unused objects',
      'Check for memory leaks (accumulating arrays, event listeners)',
    ],
  },
  EX006: {
    summary: 'Operation timed out after {timeout}ms',
    detail: 'The async operation didn\'t complete in time.',
    suggestions: [
      'Increase the timeout if the operation is expected to be slow',
      'Check if the operation is stuck in an infinite loop',
      'Add progress reporting for long operations',
    ],
  },
  EX007: {
    summary: 'Assertion failed: {message}',
    detail: 'A runtime assertion failed, indicating an unexpected state.',
    suggestions: [
      'Check the condition that was asserted',
      'Review the code path that led to this assertion',
    ],
  },
  EX008: {
    summary: 'Invalid operation: {message}',
    detail: 'The operation is not valid in the current state.',
    suggestions: [
      'Check the operation\'s preconditions',
      'Make sure the object is in the correct state',
    ],
  },
  EX009: {
    summary: 'Runtime type error: expected {expected}, got {actual}',
    detail: 'A type mismatch occurred at runtime.',
    suggestions: [
      'Add runtime type checks',
      'Use type guards to validate input',
    ],
  },
  EX010: {
    summary: 'Module initialization failed: {message}',
    detail: 'The module couldn\'t initialize properly.',
    suggestions: [
      'Check the module\'s dependencies',
      'Look for errors in the module\'s initialization code',
    ],
  },
  
  // Resource errors
  EF001: {
    summary: 'File not found: "{path}"',
    detail: 'The file doesn\'t exist at the specified path.',
    suggestions: [
      'Check the file path for typos',
      'Make sure the file exists',
      'Use a relative path from the current file',
    ],
  },
  EF002: {
    summary: 'Module not found: "{path}"',
    detail: 'The module couldn\'t be resolved from the import path.',
    suggestions: [
      'Check the import path',
      'Make sure the module is installed',
      'Check your module resolution configuration',
    ],
  },
  EF003: {
    summary: 'Permission denied: "{path}"',
    detail: 'You don\'t have permission to access this resource.',
    suggestions: [
      'Check file permissions',
      'Request necessary permissions',
    ],
  },
  EF004: {
    summary: 'Invalid path: "{path}"',
    detail: 'The path format is invalid.',
    suggestions: [
      'Use forward slashes for paths',
      'Avoid special characters',
      'Make sure the path is properly escaped',
    ],
  },
  EF005: {
    summary: 'Resource limit exceeded',
    detail: 'The operation exceeded a resource limit (file size, count, etc.).',
    suggestions: [
      'Reduce the size of the resource',
      'Process in smaller batches',
    ],
  },
  EF006: {
    summary: 'Network error: {message}',
    detail: 'A network operation failed.',
    suggestions: [
      'Check your internet connection',
      'The server might be unavailable',
      'Add retry logic for transient failures',
    ],
  },
  EF007: {
    summary: 'Invalid JSON: {message}',
    detail: 'The JSON couldn\'t be parsed.',
    suggestions: [
      'Validate the JSON syntax',
      'Check for missing quotes, brackets, or commas',
      'Use a JSON validator tool',
    ],
  },
  EF008: {
    summary: 'Invalid module format',
    detail: 'The file is not a valid CardScript module.',
    suggestions: [
      'Make sure the file is valid CardScript',
      'Check for syntax errors',
    ],
  },
  EF009: {
    summary: 'Version mismatch: expected {expected}, got {actual}',
    detail: 'The module was written for a different version of CardScript.',
    suggestions: [
      'Update the module to the current version',
      'Use a version migration tool',
    ],
  },
  EF010: {
    summary: 'Dependency resolution failed',
    detail: 'Couldn\'t resolve all dependencies for the module.',
    suggestions: [
      'Install missing dependencies',
      'Check for version conflicts',
    ],
  },
  
  // Security errors
  EZ001: {
    summary: 'Forbidden function: "{function}"',
    detail: 'This function is not allowed in the CardScript sandbox for security reasons.',
    suggestions: [
      'Use a safe alternative',
      'Request elevated permissions if needed',
    ],
  },
  EZ002: {
    summary: 'Global variable access not allowed: "{name}"',
    detail: 'Accessing global variables is restricted in the sandbox.',
    suggestions: [
      'Use module imports instead',
      'Pass values through parameters',
    ],
  },
  EZ003: {
    summary: 'Prototype manipulation not allowed',
    detail: 'Modifying object prototypes is restricted for security.',
    suggestions: [
      'Use composition instead of inheritance',
      'Create new objects with the desired properties',
    ],
  },
  EZ004: {
    summary: 'eval/Function constructor not allowed',
    detail: 'Dynamic code execution is not allowed in the sandbox.',
    suggestions: [
      'Use static code paths',
      'Pre-compile any dynamic behavior',
    ],
  },
  EZ005: {
    summary: 'Potential infinite loop detected',
    detail: 'The code appears to have a loop that might not terminate.',
    suggestions: [
      'Add a loop counter limit',
      'Ensure the loop condition will eventually be false',
    ],
  },
  EZ006: {
    summary: 'Excessive memory allocation',
    detail: 'The code is allocating too much memory.',
    suggestions: [
      'Reduce array/object sizes',
      'Process data in smaller chunks',
    ],
  },
  EZ007: {
    summary: 'Suspicious code pattern detected',
    detail: 'The code contains a pattern that might be malicious.',
    suggestions: [
      'Review the flagged code',
      'Simplify complex expressions',
    ],
  },
  EZ008: {
    summary: 'Sandbox escape attempt detected',
    detail: 'The code attempted to break out of the security sandbox.',
    suggestions: [
      'Use only allowed APIs',
      'Don\'t try to access restricted resources',
    ],
  },
  EZ009: {
    summary: 'Forbidden import: "{module}"',
    detail: 'This module is not allowed in the sandbox.',
    suggestions: [
      'Use an allowed alternative',
      'Check the list of allowed modules',
    ],
  },
  EZ010: {
    summary: 'Resource exhaustion: {resource}',
    detail: 'The code is using too many resources.',
    suggestions: [
      'Reduce resource usage',
      'Add cleanup for resources',
    ],
  },
  
  // Deprecation warnings
  WD001: {
    summary: 'Function "{name}" is deprecated',
    detail: 'This function will be removed in a future version. Use "{replacement}" instead.',
    suggestions: [
      'Replace with the suggested alternative',
      'Check the migration guide',
    ],
  },
  WD002: {
    summary: 'Type "{name}" is deprecated',
    detail: 'This type will be removed in a future version.',
    suggestions: [
      'Use the suggested replacement type',
    ],
  },
  WD003: {
    summary: 'Parameter "{name}" is deprecated',
    detail: 'This parameter will be removed. Use "{replacement}" instead.',
    suggestions: [
      'Update to use the new parameter name',
    ],
  },
  WD004: {
    summary: 'Card "{name}" is deprecated',
    detail: 'This card will be removed. Use "{replacement}" instead.',
    suggestions: [
      'Update to use the replacement card',
    ],
  },
  WD005: {
    summary: 'Module "{name}" is deprecated',
    detail: 'This module will be removed.',
    suggestions: [
      'Use the replacement module',
    ],
  },
  
  // Style warnings
  WS001: {
    summary: 'Non-standard naming: "{name}"',
    detail: 'The name doesn\'t follow naming conventions. Use camelCase for variables, PascalCase for types.',
    suggestions: [
      'Rename to follow conventions',
      'Variables: myVariable',
      'Functions: myFunction',
      'Types: MyType',
      'Constants: MY_CONSTANT',
    ],
  },
  WS002: {
    summary: 'Unused variable "{name}"',
    detail: 'The variable is declared but never used.',
    suggestions: [
      'Remove the unused variable',
      'Prefix with _ if intentionally unused',
    ],
  },
  WS003: {
    summary: 'Unused import "{name}"',
    detail: 'The import is not used anywhere in the file.',
    suggestions: [
      'Remove the unused import',
      'Use the imported value',
    ],
  },
  WS004: {
    summary: 'Implicit any type',
    detail: 'The type couldn\'t be inferred and defaulted to any.',
    suggestions: [
      'Add an explicit type annotation',
      'Enable strict type checking',
    ],
  },
  WS005: {
    summary: 'Prefer const over let',
    detail: 'This variable is never reassigned, so const is more appropriate.',
    suggestions: [
      'Change let to const',
    ],
  },
  WS006: {
    summary: 'Empty block',
    detail: 'This block is empty. If intentional, add a comment.',
    suggestions: [
      'Add code to the block',
      'Add a comment explaining why it\'s empty',
      'Remove the empty block',
    ],
  },
  WS007: {
    summary: 'debugger statement',
    detail: 'Debugger statements should be removed before deployment.',
    suggestions: [
      'Remove the debugger statement',
      'Use conditional debugging instead',
    ],
  },
  WS008: {
    summary: 'console statement',
    detail: 'Console statements should typically be removed for production.',
    suggestions: [
      'Remove console statements',
      'Use a proper logging library',
    ],
  },
  WS009: {
    summary: 'TODO/FIXME comment',
    detail: 'This comment indicates incomplete work.',
    suggestions: [
      'Complete the TODO',
      'Create a task/issue to track it',
    ],
  },
  WS010: {
    summary: 'Magic number {value}',
    detail: 'Unnamed numeric literals make code harder to understand.',
    suggestions: [
      'Extract to a named constant',
      'Add a comment explaining the value',
    ],
  },
  
  // Performance warnings
  WP001: {
    summary: 'Allocation in process loop',
    detail: 'Creating objects/arrays in the process loop causes garbage collection pauses.',
    suggestions: [
      'Preallocate outside the loop',
      'Reuse objects instead of creating new ones',
    ],
    example: '// Instead of:\nprocess() {\n  const arr = []; // allocation!\n}\n\n// Write:\nconst arr = []; // preallocated\nprocess() {\n  arr.length = 0; // reuse\n}',
  },
  WP002: {
    summary: 'Closure in hot path',
    detail: 'Creating closures in frequently-called code can hurt performance.',
    suggestions: [
      'Define functions outside the hot path',
      'Use bound methods',
    ],
  },
  WP003: {
    summary: 'Array copy instead of view',
    detail: 'Copying arrays is expensive. Consider using a view/slice.',
    suggestions: [
      'Use TypedArray views',
      'Use slice() only when needed',
    ],
  },
  WP004: {
    summary: 'Synchronous operation in async context',
    detail: 'Heavy synchronous operations can block the audio thread.',
    suggestions: [
      'Move heavy work to a worker',
      'Break into smaller chunks',
    ],
  },
  WP005: {
    summary: 'Inefficient string concatenation',
    detail: 'Building strings with + in a loop is inefficient.',
    suggestions: [
      'Use array.join()',
      'Use template literals',
    ],
  },
  WP006: {
    summary: 'Unnecessary type conversion',
    detail: 'This type conversion is redundant.',
    suggestions: [
      'Remove the conversion',
      'The value is already the target type',
    ],
  },
  WP007: {
    summary: 'Large object copy',
    detail: 'Copying large objects is expensive.',
    suggestions: [
      'Use references instead of copies',
      'Use structural sharing',
    ],
  },
  WP008: {
    summary: 'Repeated computation',
    detail: 'The same computation is done multiple times.',
    suggestions: [
      'Cache the result',
      'Move computation outside loop',
    ],
  },
  WP009: {
    summary: 'Missing early return',
    detail: 'Adding an early return could avoid unnecessary work.',
    suggestions: [
      'Add guard clauses at the start',
      'Return early when conditions are met',
    ],
  },
  WP010: {
    summary: 'Excessive recursion depth ({depth})',
    detail: 'Deep recursion can cause stack overflow and is slower than iteration.',
    suggestions: [
      'Convert to iterative approach',
      'Use trampolining',
      'Add tail-call optimization',
    ],
  },
};

// ============================================================================
// DIAGNOSTIC MESSAGE
// ============================================================================

/**
 * A single diagnostic message (error/warning).
 */
export interface Diagnostic {
  /** Error code for programmatic handling */
  code: ErrorCode;
  /** Severity level */
  severity: ErrorSeverity;
  /** Category for filtering */
  category: ErrorCategory;
  /** Source location */
  location?: SourceSpan;
  /** Related AST node */
  node?: ASTNode;
  /** Formatted message (populated by formatDiagnostic) */
  message: string;
  /** Detailed explanation */
  detail: string;
  /** Suggestions for fixing */
  suggestions: string[];
  /** Example of correct code */
  example?: string;
  /** Documentation URL */
  docsUrl?: string;
  /** Related diagnostics */
  related?: Diagnostic[];
  /** Placeholder values used in message */
  placeholders: Record<string, string | number>;
}

/**
 * Creates a diagnostic with the given error code.
 */
export function createDiagnostic(
  code: ErrorCode,
  placeholders: Record<string, string | number> = {},
  location?: SourceSpan,
  node?: ASTNode
): Diagnostic {
  const template = ERROR_TEMPLATES[code];
  const category = getCategory(code);
  const severity = getSeverity(code);
  
  // Replace placeholders in message
  const message = replacePlaceholders(template.summary, placeholders);
  const detail = replacePlaceholders(template.detail, placeholders);
  const suggestions = template.suggestions.map(s => replacePlaceholders(s, placeholders));
  const example = template.example ? replacePlaceholders(template.example, placeholders) : undefined;
  
  return {
    code,
    severity,
    category,
    ...(location !== undefined && { location }),
    ...(node !== undefined && { node }),
    message,
    detail,
    suggestions,
    ...(example !== undefined && { example }),
    docsUrl: template.docsUrl ?? `https://cardplay.dev/docs/errors/${code}`,
    placeholders,
  };
}

/**
 * Gets the category from an error code.
 */
function getCategory(code: ErrorCode): ErrorCategory {
  const prefix = code.slice(0, 2);
  switch (prefix) {
    case 'ES': return 'syntax';
    case 'ET': return 'type';
    case 'ER': return 'reference';
    case 'EM': return 'semantic';
    case 'EX': return 'runtime';
    case 'EF': return 'resource';
    case 'EZ': return 'security';
    case 'WD': return 'deprecated';
    case 'WS': return 'style';
    case 'WP': return 'performance';
    default: return 'semantic';
  }
}

/**
 * Gets the severity from an error code.
 */
function getSeverity(code: ErrorCode): ErrorSeverity {
  const prefix = code[0];
  switch (prefix) {
    case 'E': return 'error';
    case 'W': return 'warning';
    default: return 'error';
  }
}

/**
 * Replaces placeholders in a string.
 */
function replacePlaceholders(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in values ? String(values[key]) : match;
  });
}

// ============================================================================
// DIAGNOSTIC COLLECTION
// ============================================================================

/**
 * Collection of diagnostics with helpers.
 */
export class DiagnosticCollection {
  private readonly diagnostics: Diagnostic[] = [];
  
  /** Adds a diagnostic. */
  add(diagnostic: Diagnostic): void {
    this.diagnostics.push(diagnostic);
  }
  
  /** Adds an error. */
  error(code: ErrorCode, placeholders?: Record<string, string | number>, location?: SourceSpan, node?: ASTNode): void {
    this.add(createDiagnostic(code, placeholders, location, node));
  }
  
  /** Adds a warning. */
  warning(code: ErrorCode, placeholders?: Record<string, string | number>, location?: SourceSpan, node?: ASTNode): void {
    this.add(createDiagnostic(code, placeholders, location, node));
  }
  
  /** Gets all diagnostics. */
  getAll(): readonly Diagnostic[] {
    return this.diagnostics;
  }
  
  /** Gets errors only. */
  getErrors(): Diagnostic[] {
    return this.diagnostics.filter(d => d.severity === 'error');
  }
  
  /** Gets warnings only. */
  getWarnings(): Diagnostic[] {
    return this.diagnostics.filter(d => d.severity === 'warning');
  }
  
  /** Checks if there are any errors. */
  hasErrors(): boolean {
    return this.diagnostics.some(d => d.severity === 'error');
  }
  
  /** Gets diagnostics by category. */
  getByCategory(category: ErrorCategory): Diagnostic[] {
    return this.diagnostics.filter(d => d.category === category);
  }
  
  /** Gets diagnostics for a specific line. */
  getForLine(line: number): Diagnostic[] {
    return this.diagnostics.filter(d => 
      d.location && d.location.start.line <= line && d.location.end.line >= line
    );
  }
  
  /** Clears all diagnostics. */
  clear(): void {
    this.diagnostics.length = 0;
  }
  
  /** Gets count. */
  get length(): number {
    return this.diagnostics.length;
  }
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Formats a diagnostic as a string.
 */
export function formatDiagnostic(diagnostic: Diagnostic, source?: string): string {
  const lines: string[] = [];
  
  // Header with severity and location
  const severity = diagnostic.severity.toUpperCase();
  const location = diagnostic.location 
    ? `${diagnostic.location.start.line}:${diagnostic.location.start.column}`
    : '';
  
  lines.push(`${severity}[${diagnostic.code}]${location ? ` at ${location}` : ''}: ${diagnostic.message}`);
  
  // Code snippet with pointer
  if (source && diagnostic.location) {
    lines.push('');
    lines.push(...formatCodeSnippet(source, diagnostic.location));
  }
  
  // Detail
  if (diagnostic.detail) {
    lines.push('');
    lines.push(wrapText(diagnostic.detail, 80));
  }
  
  // Suggestions
  if (diagnostic.suggestions.length > 0) {
    lines.push('');
    lines.push('Suggestions:');
    for (const suggestion of diagnostic.suggestions) {
      lines.push(`  • ${suggestion}`);
    }
  }
  
  // Example
  if (diagnostic.example) {
    lines.push('');
    lines.push('Example:');
    lines.push(diagnostic.example.split('\n').map(l => '  ' + l).join('\n'));
  }
  
  // Docs link
  if (diagnostic.docsUrl) {
    lines.push('');
    lines.push(`Learn more: ${diagnostic.docsUrl}`);
  }
  
  return lines.join('\n');
}

/**
 * Formats a code snippet with error highlighting.
 */
export function formatCodeSnippet(source: string, location: SourceSpan, contextLines = 2): string[] {
  const sourceLines = source.split('\n');
  const startLine = Math.max(0, location.start.line - 1 - contextLines);
  const endLine = Math.min(sourceLines.length - 1, location.end.line - 1 + contextLines);
  
  const lines: string[] = [];
  const lineNumWidth = String(endLine + 1).length;
  
  for (let i = startLine; i <= endLine; i++) {
    const lineNum = String(i + 1).padStart(lineNumWidth);
    const marker = (i >= location.start.line - 1 && i <= location.end.line - 1) ? '>' : ' ';
    lines.push(`${marker} ${lineNum} | ${sourceLines[i]!}`);
    
    // Add pointer line for error line
    if (i === location.start.line - 1) {
      const padding = ' '.repeat(lineNumWidth + 4);
      const start = location.start.column - 1;
      const length = i === location.end.line - 1 
        ? location.end.column - location.start.column
        : sourceLines[i]!.length - start;
      const pointer = ' '.repeat(start) + '^'.repeat(Math.max(1, length));
      lines.push(`  ${padding}${pointer}`);
    }
  }
  
  return lines;
}

/**
 * Wraps text at a given width.
 */
function wrapText(text: string, width: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines.join('\n');
}

/**
 * Formats all diagnostics for display.
 */
export function formatDiagnostics(diagnostics: readonly Diagnostic[], source?: string): string {
  const formatted = diagnostics.map(d => formatDiagnostic(d, source));
  
  const errors = diagnostics.filter(d => d.severity === 'error').length;
  const warnings = diagnostics.filter(d => d.severity === 'warning').length;
  
  const summary = [];
  if (errors > 0) summary.push(`${errors} error${errors > 1 ? 's' : ''}`);
  if (warnings > 0) summary.push(`${warnings} warning${warnings > 1 ? 's' : ''}`);
  
  return formatted.join('\n\n') + '\n\n' + 
    (summary.length > 0 ? `Found ${summary.join(' and ')}.` : 'No issues found.');
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Creates a syntax error.
 */
export function syntaxError(
  code: Extract<ErrorCode, `ES${string}`>,
  placeholders: Record<string, string | number>,
  location?: SourceSpan
): Diagnostic {
  return createDiagnostic(code, placeholders, location);
}

/**
 * Creates a type error.
 */
export function typeError(
  code: Extract<ErrorCode, `ET${string}`>,
  placeholders: Record<string, string | number>,
  location?: SourceSpan,
  node?: ASTNode
): Diagnostic {
  return createDiagnostic(code, placeholders, location, node);
}

/**
 * Creates a reference error.
 */
export function referenceError(
  code: Extract<ErrorCode, `ER${string}`>,
  placeholders: Record<string, string | number>,
  location?: SourceSpan
): Diagnostic {
  return createDiagnostic(code, placeholders, location);
}

/**
 * Suggests similar names for "did you mean" hints.
 */
export function suggestSimilar(name: string, candidates: string[], maxDistance = 3): string[] {
  const suggestions: Array<{ name: string; distance: number }> = [];
  
  for (const candidate of candidates) {
    const distance = levenshteinDistance(name.toLowerCase(), candidate.toLowerCase());
    if (distance <= maxDistance) {
      suggestions.push({ name: candidate, distance });
    }
  }
  
  return suggestions
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(s => s.name);
}

/**
 * Calculates Levenshtein edit distance.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,      // deletion
        matrix[i]![j - 1]! + 1,      // insertion
        matrix[i - 1]![j - 1]! + cost // substitution
      );
    }
  }
  
  return matrix[b.length]![a.length]!;
}

// ============================================================================
// EXPORT ALL ERROR TEMPLATES FOR DOCUMENTATION
// ============================================================================

/**
 * Gets all error templates (for documentation generation).
 */
export function getAllErrorTemplates(): Record<ErrorCode, ErrorTemplate> {
  return { ...ERROR_TEMPLATES };
}

/**
 * Gets error codes by category.
 */
export function getErrorCodesByCategory(category: ErrorCategory): ErrorCode[] {
  const allCodes = Object.keys(ERROR_TEMPLATES) as ErrorCode[];
  return allCodes.filter(code => getCategory(code) === category);
}
