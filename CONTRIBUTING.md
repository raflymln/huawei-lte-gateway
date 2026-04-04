# Contributing

## Development Setup

```bash
bun install
bun run build
```

## Quality Checks

All commits must pass these checks (enforced by lefthook):

```bash
bun run typecheck  # TypeScript type checking
bun run lint       # ESLint
bun run test       # Run tests
bun run format     # Prettier formatting
```

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix a bug
docs: update documentation
chore: maintenance tasks
refactor: code refactoring
test: add tests
ci: CI/CD changes
```

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all checks pass
5. Submit a PR

## Testing

Add tests for new functionality. Run tests with:

```bash
bun run test
```

## Modem Compatibility

This gateway is tested on Huawei E3372H-607. When adding features, consider compatibility with other models.
