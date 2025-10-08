#!/usr/bin/env node

/**
 * Husky Hooks Setup and Testing Script
 * 
 * This script helps developers understand and test the Husky git hooks
 * that are configured for this project.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(title) {
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  console.log(colorize(title, 'bright'));
  console.log(colorize('='.repeat(60), 'cyan'));
}

function printSection(title) {
  console.log('\n' + colorize(`📋 ${title}`, 'blue'));
  console.log(colorize('-'.repeat(40), 'blue'));
}

function printSuccess(message) {
  console.log(colorize(`✅ ${message}`, 'green'));
}

function printWarning(message) {
  console.log(colorize(`⚠️  ${message}`, 'yellow'));
}

function printError(message) {
  console.log(colorize(`❌ ${message}`, 'red'));
}

// function printInfo(message) {
//   console.log(colorize(`ℹ️  ${message}`, 'cyan'));
// }

function runCommand(command, description) {
  try {
    console.log(colorize(`Running: ${command}`, 'magenta'));
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    printSuccess(`${description} - PASSED`);
    return { success: true, output };
  } catch (error) {
    printError(`${description} - FAILED`);
    console.log(colorize(`Error: ${error.message}`, 'red'));
    return { success: false, error: error.message };
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function main() {
  printHeader('🪝 Husky Git Hooks Setup & Testing');
  
  console.log(colorize('This script will help you understand and test the Husky git hooks configured for this project.', 'bright'));
  
  // Check if Husky is installed
  printSection('Checking Husky Installation');
  
  if (!checkFileExists('.husky')) {
    printError('Husky directory not found. Please run: npm install');
    process.exit(1);
  }
  
  if (!checkFileExists('.husky/pre-commit')) {
    printError('Pre-commit hook not found. Please run: npm run prepare');
    process.exit(1);
  }
  
  if (!checkFileExists('.husky/pre-push')) {
    printError('Pre-push hook not found. Please run: npm run prepare');
    process.exit(1);
  }
  
  if (!checkFileExists('.husky/commit-msg')) {
    printError('Commit message hook not found. Please run: npm run prepare');
    process.exit(1);
  }
  
  printSuccess('All Husky hooks are properly installed');
  
  // Test individual commands
  printSection('Testing Individual Commands');
  
  const tests = [
    { command: 'npm run lint', description: 'ESLint check' },
    { command: 'npm run pretty:check', description: 'Prettier check' },
    { command: 'npm run build', description: 'Production build' },
    { command: 'npm run check-deps', description: 'Dependency check' },
    { command: 'npm run check-security', description: 'Security audit' }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    const result = runCommand(test.command, test.description);
    if (!result.success) {
      allPassed = false;
    }
  }
  
  // Test lint-staged configuration
  printSection('Testing Lint-Staged Configuration');
  
  runCommand('npx lint-staged --help', 'Lint-staged availability');
  
  // Show configuration
  printSection('Current Configuration');
  
  console.log(colorize('Pre-commit Hook:', 'bright'));
  console.log('  - Runs ESLint with --fix on staged TypeScript/TSX files');
  console.log('  - Runs Prettier on all staged files');
  console.log('  - Automatically fixes formatting and linting issues');
  
  console.log(colorize('\nPre-push Hook:', 'bright'));
  console.log('  - TypeScript compilation check');
  console.log('  - Full ESLint check on all files');
  console.log('  - Outdated dependencies check');
  console.log('  - Security vulnerability scan');
  console.log('  - Production build verification');
  console.log('  - Large files detection (>1MB)');
  console.log('  - TODO/FIXME comments warning');
  console.log('  - Console statements warning');
  
  console.log(colorize('\nCommit Message Hook:', 'bright'));
  console.log('  - Enforces conventional commits format');
  console.log('  - Validates message length (<100 chars)');
  console.log('  - Prevents WIP/TODO commits');
  
  // Show usage examples
  printSection('Usage Examples');
  
  console.log(colorize('Normal Workflow:', 'bright'));
  console.log('  git add .');
  console.log('  git commit -m "feat: add new feature"  # Pre-commit runs');
  console.log('  git push origin feature-branch         # Pre-push runs');
  
  console.log(colorize('\nManual Quality Checks:', 'bright'));
  console.log('  npm run check-all     # Run all checks');
  console.log('  npm run lint-fix      # Fix linting issues');
  console.log('  npm run pretty        # Format code');
  
  console.log(colorize('\nBypassing Hooks (Emergency Only):', 'bright'));
  console.log('  git commit -m "hotfix: critical issue" --no-verify');
  console.log('  git push origin main --no-verify');
  
  // Show commit message examples
  printSection('Commit Message Examples');
  
  const examples = [
    'feat(auth): add login functionality',
    'fix(ui): resolve button alignment issue',
    'docs: update README with setup instructions',
    'refactor(api): simplify user service',
    'perf: optimize bundle size',
    'test: add unit tests for utils',
    'build: update webpack configuration',
    'ci: add automated testing pipeline',
    'chore: update dependencies',
    'revert: revert previous commit'
  ];
  
  examples.forEach(example => {
    console.log(`  ${colorize(example, 'green')}`);
  });
  
  // Final summary
  printSection('Summary');
  
  if (allPassed) {
    printSuccess('All quality checks passed! Your codebase is healthy.');
  } else {
    printWarning('Some quality checks failed. Please address the issues above.');
  }
  
  console.log(colorize('\n📚 For more information, see:', 'bright'));
  console.log('  - .husky/README.md (detailed documentation)');
  console.log('  - package.json (lint-staged configuration)');
  console.log('  - eslint.config.js (ESLint rules)');
  
  console.log(colorize('\n🎯 Next Steps:', 'bright'));
  console.log('  1. Make some changes to your code');
  console.log('  2. Run: git add .');
  console.log('  3. Run: git commit -m "feat: test husky hooks"');
  console.log('  4. Run: git push origin your-branch');
  console.log('  5. Watch the hooks run automatically!');
  
  printHeader('Setup Complete! 🎉');
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(colorize('Husky Hooks Setup & Testing Script', 'bright'));
  console.log('\nUsage: node scripts/setup-hooks.js [options]');
  console.log('\nOptions:');
  console.log('  --help, -h    Show this help message');
  console.log('\nThis script tests the Husky git hooks configuration and provides usage examples.');
  process.exit(0);
}

main();
