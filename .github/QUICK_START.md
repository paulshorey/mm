# GitHub Copilot Agents - Quick Start Guide

## TL;DR

This repo has custom GitHub Copilot agents. Use `@orchestrator` for complex tasks.

## Simple Usage

### For simple tasks (single file):
```
Fix the typo in apps/trade/README.md
```
Just use Copilot normally.

### For complex tasks (multiple files):
```
@orchestrator Add a new charting feature to price-ui
```
The orchestrator will coordinate a 6-phase workflow.

## Available Agents

| Agent | Use For |
|-------|---------|
| `@orchestrator` | Complex multi-file tasks (use this most often) |
| `@codebase-explorer` | Understanding code structure |
| `@web-researcher` | Finding libraries and best practices |
| `@implementer` | Direct code implementation |
| `@refactorer` | Code quality improvements |
| `@test-writer` | Writing unit tests |
| `@reviewer-documenter` | Code review and documentation |

## Examples

### Example 1: Add New Feature
```
@orchestrator Add authentication to the trade app using JWT
```

### Example 2: Fix Bug
```
@orchestrator Fix the chart rendering issue in price-ui when 
data is empty
```

### Example 3: Explore Code
```
@codebase-explorer Show me how database queries work in the 
common library
```

### Example 4: Research
```
@web-researcher Find the best React library for real-time 
WebSocket connections
```

## How Orchestrator Works

When you invoke `@orchestrator`, it:

1. **Explores** - Finds the code that needs changing
2. **Researches** (if needed) - Looks up best practices
3. **Implements** - Writes the code
4. **Refactors** - Cleans up the code
5. **Tests** (if needed) - Writes tests
6. **Reviews** - Checks everything works

You can provide feedback at any checkpoint.

## Monorepo Commands

This is a TurboRepo monorepo. Always use `pnpm`:

```bash
# From app directory
cd apps/trade
pnpm run build
pnpm run test

# From root
pnpm --filter trade build
pnpm --filter trade test
```

## Import Paths

- **App imports:** `@/path/to/file` (within same app)
- **Shared utilities:** `@lib/common/...`

Example:
```typescript
import { cc } from '@lib/common/cc'
import { getDb } from '@lib/common/lib/db/neon'
```

## Tips

1. **Be specific** - Clear requests get better results
2. **Trust the workflow** - Each phase builds on previous work
3. **Use orchestrator** - For anything touching multiple files
4. **Check AGENTS.md** - Each folder has specific guidance

## More Info

- **Full Setup:** `.github/COPILOT_SETUP.md`
- **Comparison:** `.github/WORKFLOW_COMPARISON.md`
- **Agents Docs:** `.github/agents/README.md`

## Questions?

Ask in the repo discussions or issues.
