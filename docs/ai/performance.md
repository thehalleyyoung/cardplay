# AI Performance & Budgets

CardPlay’s AI system ships with dev-only profiling tools and targeted benchmark tests to catch regressions.

## Query profiling

The Prolog adapter can record timing data per query. Supporting utilities include:

- Query profiling + summaries: `src/ai/engine/query-profiler.ts`
- Slow query logging: `src/ai/engine/slow-query-logger.ts`
- Profiling tools/reporting: `src/ai/engine/profiling-tools.ts`

## Budgets

The system uses practical budgets for browser JS Prolog:

- Common query **p95** target: `< 50ms`
- Workflow planning benchmark target: `< 200ms`
- Project analysis benchmark target: `< 1s`

## Benchmarks

Run the targeted AI benchmark suite:

```sh
npm -C cardplay run test:ai:bench
```

This includes:

- Prolog adapter throughput/micro-benchmarks
- KB lifecycle/perf tests
- Workflow planning benchmark
- Project analysis benchmark

## Memory tooling

Memory estimates and dashboards are provided by:

- `src/ai/engine/kb-memory-profiler.ts`

