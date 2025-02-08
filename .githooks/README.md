# Git Hooks

This directory contains the project's git hooks.

## Installation

To install the hooks, run from the project root:

```bash
cp .githooks/* .git/hooks/
chmod +x .git/hooks/*
```

## Available hooks

- pre-commit: Runs tests before each commit
- commit-msg: Validates commit messages
