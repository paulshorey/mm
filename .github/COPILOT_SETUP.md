# GitHub Copilot Agentic Workflow Setup

This document explains the GitHub Copilot custom agent configuration for this monorepo.

## What Was Implemented

Based on the latest GitHub Copilot best practices (2025-2026), we've created a multi-agent workflow system similar to the existing `.claude` folder structure, but adapted for GitHub Copilot's architecture.

## Key Benefits

### 1. **Specialized Agents with Isolated Contexts**

Each agent has a focused role and its own context window:
- **Orchestrator** - Coordinates the entire workflow
- **Codebase Explorer** - Maps the codebase and finds affected files
- **Web Researcher** - Researches libraries and best practices
- **Implementer** - Writes the actual code
- **Refactorer** - Improves code quality
- **Test Writer** - Creates unit tests
- **Reviewer/Documenter** - Final review and documentation

This isolation prevents context overload and allows each agent to focus on its specialty.

### 2. **Optimized for Monorepo Complexity**

All agents understand:
- TurboRepo structure
- Multiple NextJS apps
- Shared library architecture
- Correct import paths
- Package management with pnpm
- How to target specific apps

### 3. **Synchronous Sequential Workflow**

The orchestrator runs phases in order:
1. Explore → 2. Research (optional) → 3. Implement → 4. Refactor → 5. Test (optional) → 6. Review

This ensures:
- Each phase builds on previous work
- Quality checks at every step
- Clear decision points
- User can provide feedback between phases

### 4. **Context-Aware and Adaptive**

- Optional phases (research, testing) are skipped when not needed
- Orchestrator asks for clarification when uncertain
- Agents follow existing code patterns
- Documentation is kept up-to-date

## File Structure

```
.github/
├── copilot-instructions.md          # Global project context
└── agents/
    ├── README.md                     # Workflow documentation
    ├── orchestrator.agent.md         # Master coordinator
    ├── codebase-explorer.agent.md    # Code exploration
    ├── web-researcher.agent.md       # Research phase
    ├── implementer.agent.md          # Implementation
    ├── refactorer.agent.md           # Refactoring
    ├── test-writer.agent.md          # Testing
    └── reviewer-documenter.agent.md  # Review & docs
```

## How to Use

### Simple Tasks

For simple, single-file changes, just describe what you want:

```
Fix the typo in apps/trade/README.md
```

Copilot will handle it directly without the orchestrator.

### Complex Tasks

For multi-file changes or complex features, invoke the orchestrator:

```
@orchestrator Add a new volume-weighted moving average indicator 
to the price-ui app using HighCharts
```

The orchestrator will:
1. Explore the price-ui codebase
2. Research HighCharts VWMA APIs
3. Implement the feature
4. Refactor for quality
5. Write tests
6. Review and document

### Invoking Specific Agents

You can also invoke specific agents directly:

```
@codebase-explorer Find all database query functions in the common library
```

```
@web-researcher Find the best TypeScript library for technical analysis indicators
```

## Comparison: Claude Code vs GitHub Copilot

| Aspect | Claude Code (`.claude/`) | GitHub Copilot (`.github/`) |
|--------|--------------------------|------------------------------|
| **Location** | `.claude/agents/*.md` | `.github/agents/*.agent.md` |
| **Format** | Markdown with frontmatter | `.agent.md` with YAML |
| **Model Selection** | Explicitly defined per agent | Managed by Copilot |
| **Global Context** | `.claude/CLAUDE.md` | `.github/copilot-instructions.md` |
| **Orchestration** | User-defined custom agent | Built into @orchestrator |
| **Tool Access** | Defined in each agent | YAML frontmatter + Copilot tools |
| **Usage** | Claude Code IDE | GitHub Copilot in VS Code/IDEs |

Both systems follow the **same philosophy**: specialized agents with isolated contexts coordinated by an orchestrator.

## Agent Configuration Format

Each agent uses YAML frontmatter for configuration:

```markdown
---
name: agent-name
description: |
  What this agent does
tools:
  - read
  - edit
  - test
metadata:
  component: category
  project-area: scope
---

# Agent Instructions

Detailed instructions for the agent...
```

## Benefits Over Single-Agent Approach

### Without Agentic Workflow:
- ❌ Single agent must handle everything
- ❌ Context window gets cluttered
- ❌ High-level understanding mixed with implementation details
- ❌ Research and exploration add noise
- ❌ Quality checks happen ad-hoc

### With Agentic Workflow:
- ✅ Each agent focuses on its specialty
- ✅ Clean, isolated context per phase
- ✅ Orchestrator maintains high-level view
- ✅ Structured research and exploration
- ✅ Built-in quality gates and reviews

## Integration with Existing .claude Setup

The `.claude` folder remains for Claude Code users. The new `.github` setup serves GitHub Copilot users. Both can coexist since they serve different AI coding assistants.

**Developers can use:**
- Claude Code with `.claude/` agents
- GitHub Copilot with `.github/` agents
- Or both, depending on which tool they prefer

## Best Practices

1. **Use @orchestrator for complex tasks** - Let it coordinate the phases
2. **Be specific in requests** - Clear requirements → better results
3. **Review at checkpoints** - Orchestrator will pause when needed
4. **Trust the workflow** - Each phase builds on previous work
5. **Update AGENTS.md files** - Keep documentation current

## Testing the Setup

To verify the agents are working:

1. **Check agent discovery:**
   - In VS Code with Copilot, type `@` and see if agents appear

2. **Test simple agent:**
   ```
   @codebase-explorer Show me the structure of the apps/trade directory
   ```

3. **Test orchestrator:**
   ```
   @orchestrator Explain the current authentication flow in the trade app
   ```

## Troubleshooting

### Agents not appearing
- Ensure you have GitHub Copilot enabled
- Check that VS Code is updated to latest version
- Verify `.agent.md` files are properly formatted

### Agent not following instructions
- Check YAML frontmatter is valid
- Ensure agent name matches the filename
- Verify tools are correctly listed

### Context not being passed between phases
- This is expected - orchestrator explicitly passes context
- Check orchestrator's instructions are clear

## Future Enhancements

Potential improvements as GitHub Copilot evolves:
- Add app-specific agents (e.g., @trade-agent, @price-ui-agent)
- Create specialized agents for database migrations
- Add deployment and release agents
- Implement parallel agent execution for independent tasks

## References

- [GitHub Copilot Custom Agents Documentation](https://docs.github.com/en/copilot/how-tos/use-copilot-agents)
- [Agentic Workflow Best Practices](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
- [Custom Instructions Guide](https://docs.github.com/en/copilot/tutorials/customization-library/custom-instructions)
- [Awesome Copilot Community](https://github.com/github/awesome-copilot)

## Questions?

If you have questions about this setup or suggestions for improvement, please open an issue or discussion in the repository.
