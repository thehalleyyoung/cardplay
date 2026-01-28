# Prolog Engine Choice: Tau Prolog

## Decision

We chose **Tau Prolog** as the Prolog implementation for CardPlay's AI system.

## Evaluation Criteria

| Criterion | Tau Prolog | ts-prolog (kkty/prolog) |
|-----------|------------|-------------------------|
| **Browser Support** | ✅ Full | ✅ Full |
| **Node.js Support** | ✅ Full | ✅ Full |
| **ISO Prolog Compliance** | ✅ Extensive | ⚠️ Partial |
| **Built-in Predicates** | ✅ 200+ | ⚠️ ~30 |
| **Module System** | ✅ Yes (lists, random, etc.) | ❌ No |
| **Documentation** | ✅ Excellent | ⚠️ Minimal |
| **Active Development** | ✅ Yes (2017-present) | ❌ Dormant (7+ years) |
| **Bundle Size** | ~80KB minified | ~20KB |
| **Promise API** | ✅ Native async | ❌ Sync only |
| **Cut Operator** | ✅ Yes | ✅ Yes |
| **Negation-as-Failure** | ✅ Yes | ⚠️ Limited |
| **Backtracking** | ✅ DFS | ⚠️ BFS |
| **npm Package** | `tau-prolog` | `ts-prolog` |

## Why Tau Prolog?

### 1. ISO Prolog Compliance
Tau Prolog implements a large subset of ISO Prolog, including:
- Control constructs (cut, if-then-else)
- Clause creation/destruction (assert, retract)
- All solutions (findall, bagof, setof)
- Arithmetic evaluation and comparison
- Term manipulation (functor, arg, =..)
- Type testing predicates

### 2. Built-in Modules
Essential modules for music theory KB:
- **lists**: append, member, nth, maplist, findall
- **random**: random, random_between, random_member
- **format**: formatted output for debugging
- **concurrent**: futures for async queries

### 3. Promise-Based API
Native async/await support for non-blocking queries:
```javascript
const session = pl.create();
await session.promiseConsult(program);
await session.promiseQuery(goal);
for await (const answer of session.promiseAnswers()) {
  // Process each solution
}
```

### 4. Active Development
- Regular updates and bug fixes
- Good issue response time
- Used in academic research

### 5. Documentation Quality
- Full predicate reference
- Tutorial and examples
- API documentation

## Trade-offs

### Bundle Size
Tau Prolog is larger (~80KB vs ~20KB for ts-prolog), but this is acceptable for a desktop/web DAW where bundle size is not critical.

### Search Strategy
Tau Prolog uses **depth-first search** (standard Prolog), while ts-prolog uses **breadth-first search**. DFS is more memory-efficient and matches standard Prolog semantics.

## Installation

```bash
npm install tau-prolog
```

## Basic Usage

```typescript
import pl from 'tau-prolog';

// Create session
const session = pl.create();

// Load program
await session.promiseConsult(`
  parent(tom, bob).
  parent(bob, ann).
  grandparent(X, Z) :- parent(X, Y), parent(Y, Z).
`);

// Query
await session.promiseQuery('grandparent(tom, X).');

// Get answers
for await (const answer of session.promiseAnswers()) {
  console.log(session.format_answer(answer));
  // Output: X = ann
}
```

## References

- [Tau Prolog Documentation](http://tau-prolog.org/documentation)
- [GitHub Repository](https://github.com/tau-prolog/tau-prolog)
- [npm Package](https://www.npmjs.com/package/tau-prolog)
