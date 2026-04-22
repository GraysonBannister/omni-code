# Git Hooks Setup

This directory contains Git hooks to protect against accidentally committing secrets.

## Setup

To enable the pre-commit hook, run:

```bash
git config core.hooksPath .githooks
```

## What It Does

The pre-commit hook:
1. Runs `gitleaks protect --staged` to scan staged files for secrets
2. Blocks the commit if any potential secrets are detected
3. Provides guidance on how to fix or bypass (if false positive)

## Bypassing (Emergency Only)

If you have a false positive and need to commit:

```bash
git commit --no-verify
```

## Requirements

- [gitleaks](https://github.com/gitleaks/gitleaks) must be installed (`brew install gitleaks`)
