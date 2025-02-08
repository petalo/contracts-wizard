#!/usr/bin/env node
/**
 * @fileoverview Script for managing releases and changelog generation
 *
 * This script handles the automated release process with the following logic:
 *
 * Release Types:
 * - patch: For backwards-compatible bug fixes
 * - minor: For new features that don't break existing functionality
 * - major: For breaking changes
 *
 * Version Selection Logic:
 * 1. If changes include only chores/docs/tests -> script will force patch version
 *    Checks for:
 *    - "### Chores"
 *    - "### Documentation"
 *    - No other section headers
 *
 * 2. If changes include new features -> script will fail if patch is requested
 *    Checks for:
 *    - "### Features"
 *    - Requires --minor or --major flag
 *
 * 3. If changes include breaking changes -> script will fail if patch/minor is requested
 *    Checks for:
 *    - "### BREAKING CHANGES"
 *    - Requires --major flag
 *
 * 4. First release uses version from package.json
 *    Checks for:
 *    - No git tags exist
 *    - package.json version
 *
 * Flow:
 * 1. Parse command line arguments and validate inputs
 * 2. Check repository state (branch, changes, connectivity)
 * 3. Generate and validate changelog from commits
 * 4. Determine appropriate version bump type
 * 5. Update changelog and package version
 * 6. Create git commit and tag
 * 7. Push changes to remote repository
 * 8. Handle any errors and provide feedback
 *
 * Validation Steps:
 * 1. Repository State
 *    - Must be on main branch
 *    - No uncommitted changes
 *    - Branch up to date with remote
 *    - Required files exist (package.json, CHANGELOG.md)
 *
 * 2. Changes Analysis
 *    - Conventional commits since last tag
 *    - Groups changes by type (features, fixes, etc)
 *    - Validates version type against changes
 *    - Prevents patch for features/breaking changes
 *
 * 3. GitHub Connectivity
 *    - Tests connection before making changes
 *    - Retries on failure (3 attempts)
 *    - Validates tag existence
 *
 * Special Cases:
 * - First Release: Creates initial changelog structure
 * - No Changes: Prevents unnecessary releases
 * - Dry Run: Shows changes without applying them
 * - Patch Releases: Staged for next major/minor
 *
 * Error Handling:
 * - Repository validation errors (branch, changes, etc)
 * - Git command failures
 * - Changelog generation errors
 * - GitHub connectivity issues
 * - Version conflicts
 *
 * Functions:
 * - release: Main release process orchestrator
 * - validateRepository: Checks repository state
 * - getLatestMajorMinorTag: Gets latest version tag
 * - generateChangelog: Creates changelog from commits
 * - updateChangelog: Updates CHANGELOG.md file
 * - validateChangesAndType: Validates version type
 * - calculateNextVersion: Computes next version number
 * - handleError: Centralizes error handling
 * - initializeChangelog: Creates initial changelog
 * - generateChangelogPreview: Generates preview file
 *
 * @module scripts/release
 * @requires fs/promises
 * @requires path
 * @requires child_process
 * @requires commander
 */

const { execSync } = require('child_process');
const { program } = require('commander');
const fsPromises = require('fs').promises;
const path = require('path');
const Table = require('cli-table3');

// Configure CLI options
program
  .option('--get-changes', 'Get changes since last release')
  .option('--dry-run', 'Validate without making changes')
  .option('--preview', 'Generate changelog preview without validation')
  .option('--list-commits', 'List all commits since last tag')
  .option('--major', 'Create major release')
  .option('--minor', 'Create minor release')
  .option('--patch', 'Create patch release (default)')
  .parse(process.argv);

// Helper for logging to console
const log = {
  // eslint-disable-next-line no-console
  info: (...args) => console.log(...args),
  // eslint-disable-next-line no-console
  success: (msg) => console.log(`✓ ${msg}`),
  // eslint-disable-next-line no-console
  error: (msg) => console.error(`✗ ${msg}`),
  warning: (msg) => console.warn(`⚠ ${msg}`),
};

/**
 * Validates repository state before release
 *
 * Checks:
 * - Current branch is main or release/*
 * - No uncommitted changes
 * - Branch is up to date with remote
 * - Required files exist
 *
 * @throws {Error} If any validation fails
 */
async function validateRepository() {
  // Check GitHub connectivity first
  log.info('Checking GitHub connectivity...');
  try {
    execSync('git ls-remote --quiet', { stdio: 'inherit' });
  } catch (error) {
    throw new Error(
      'Cannot connect to GitHub. Check your connection and try again.'
    );
  }

  // Check current branch
  log.info('Checking current branch...');
  const branch = execSync('git rev-parse --abbrev-ref HEAD', {
    encoding: 'utf8',
  }).trim();
  log.info(`Current branch: ${branch}`);

  if (branch !== 'main' && !branch.startsWith('release/')) {
    throw new Error('Must be on main or release/* branch');
  }

  // Check for uncommitted changes
  log.info('Checking for uncommitted changes...');
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.length > 0) {
      throw new Error(
        'Working directory is not clean. Commit or stash changes first.'
      );
    }
  } catch (error) {
    // If git command fails, show original error
    if (error.stderr) {
      throw new Error(`Git error: ${error.stderr.toString()}`);
    }
    throw error;
  }

  // Check if branch is up to date
  log.info('Checking if branch is up to date...');
  try {
    execSync('git remote update', { stdio: 'inherit' });
    const localCommit = execSync('git rev-parse HEAD', {
      encoding: 'utf8',
    }).trim();
    const remoteCommit = execSync(`git rev-parse origin/${branch}`, {
      encoding: 'utf8',
    }).trim();

    if (localCommit !== remoteCommit) {
      // Get commit messages to compare first
      const localMessage = execSync('git log -1 --pretty=%B', {
        encoding: 'utf8',
      }).trim();

      const remoteMessage = execSync(
        `git log -1 --pretty=%B origin/${branch}`,
        { encoding: 'utf8' }
      ).trim();

      // If messages are the same but commits are different, likely an amend
      if (localMessage === remoteMessage) {
        throw new Error(
          `Branch has diverged due to amending commits.\n\n` +
            'To fix this:\n' +
            `git push --force-with-lease origin ${branch}\n\n` +
            'Then try the release again.'
        );
      }

      // If not an amend, check for missing commits
      const missingRemoteCommits = execSync(
        `git log HEAD..origin/${branch} --oneline`,
        { encoding: 'utf8' }
      ).trim();

      // Get local commits not in remote
      const missingLocalCommits = execSync(
        `git log origin/${branch}..HEAD --oneline`,
        { encoding: 'utf8' }
      ).trim();

      let message = `Branch is not up to date with origin/${branch}.\n\n`;

      if (missingLocalCommits) {
        message +=
          'Your unpushed commits:\n' +
          `${missingLocalCommits}\n\n` +
          'Try pushing your changes first:\n' +
          `git push origin ${branch}\n\n`;
      }

      if (missingRemoteCommits) {
        message +=
          'Missing remote commits:\n' +
          `${missingRemoteCommits}\n\n` +
          'To update your branch:\n' +
          `1. git fetch origin ${branch}\n` +
          '2. Configure pull strategy (choose one):\n' +
          '   git config pull.rebase true     # use rebase (recommended)\n' +
          '   git config pull.ff only         # fast-forward only\n' +
          '   git config pull.rebase false    # use merge\n' +
          `3. git pull origin ${branch}\n\n`;
      }

      message += 'Then try the release again.';

      throw new Error(message);
    }
  } catch (error) {
    // If git command fails, show original error
    if (error.stderr) {
      throw new Error(`Git error: ${error.stderr.toString()}`);
    }
    throw error;
  }

  // Check required files exist
  log.info('Checking required files...');
  const requiredFiles = ['package.json', 'CHANGELOG.md'];
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    try {
      await fsPromises.access(filePath);
    } catch {
      throw new Error(`Required file ${file} not found`);
    }
  }

  log.success('Repository validation passed');
}

/**
 * Get latest major/minor tag from git
 * @returns {string|null} Latest tag or null if no tags exist
 */
function getLatestMajorMinorTag() {
  try {
    log.info('Getting latest tag...');

    // Check if we have any tags
    const tags = execSync('git tag -l', { encoding: 'utf8' }).trim();
    if (!tags) {
      log.info('No tags found, this will be the first release');
      return null;
    }

    // Get all tags sorted by version
    const allTags = tags
      .split('\n')
      .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag))
      .sort((a, b) => {
        const [aMajor, aMinor] = a.slice(1).split('.').map(Number);
        const [bMajor, bMinor] = b.slice(1).split('.').map(Number);
        return bMajor - aMajor || bMinor - aMinor;
      });

    if (allTags.length === 0) {
      log.info('No valid semantic version tags found');
      return null;
    }

    log.info('Found tags:', allTags);
    log.info('Latest tag:', allTags[0]);
    return allTags[0];
  } catch (error) {
    log.error('Error getting latest tag:', error);
    log.info('Assuming this is the first release');
    return null;
  }
}

/**
 * Generate formatted changelog from commits
 * @param {string} [lastTag] - Last tag to compare against
 * @param {string} [repoUrl] - Repository URL for commit links
 * @returns {string} Formatted changelog content
 * @throws {Error} If no changes found or git commands fail
 */
function generateChangelog(
  lastTag = getLatestMajorMinorTag(),
  repoUrl = 'https://github.com/petalo/contracts-wizard'
) {
  try {
    log.info('Generating changelog...');
    log.info('Last tag:', lastTag || 'none (first release)');

    // Si no hay tag, usar todo el historial
    const range = lastTag ? `${lastTag}..HEAD` : '';
    log.info('Using range:', range || 'all commits (first release)');

    // Get conventional commits since last major/minor tag
    let commits;
    try {
      const command = `git log ${range} --pretty=format:"- %s ([%h](${repoUrl}/commit/%H))"`;
      log.info('Executing command:', command);

      commits = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      })
        .toString()
        .trim();
    } catch (error) {
      log.error('Git log command failed:', error);
      log.error('Command output:', error.stdout?.toString() || 'No output');
      log.error(
        'Command error:',
        error.stderr?.toString() || 'No error output'
      );
      throw new Error(`Failed to get git log: ${error.message}`);
    }

    if (!commits) {
      log.info('No commits found, checking full history...');
      commits = execSync(
        `git log --pretty=format:"- %s ([%h](${repoUrl}/commit/%H))"`,
        { encoding: 'utf8' }
      )
        .toString()
        .trim();
    }

    log.info('Found commits:', commits.split('\n').length);
    log.info('First few commits:', commits.split('\n').slice(0, 3));

    // Group commits by type with more flexible regex
    const groups = {
      Features: [],
      'Bug Fixes': [],
      Performance: [],
      'Breaking Changes': [],
      Documentation: [],
      Chores: [],
    };

    // Usar Set para deduplicar commits por hash
    const processedHashes = new Set();

    let hasContent = false;
    commits.split('\n').forEach((commit) => {
      // More flexible regex that allows for scopes and more formats
      const match = commit.match(
        /^- (?:(feat|fix|perf|break|docs|chore)(?:\([^)]*\))?:)?\s*(.*?)\s*\(\[(.*?)\]\((.*?)\)\)$/
      );

      if (match) {
        const [, type = 'chore', message, hash, url] = match;

        // Skip if we've already processed this commit
        if (processedHashes.has(hash)) {
          log.info('Skipping duplicate commit:', {
            hash,
            message,
          });
          return;
        }
        processedHashes.add(hash);

        log.info('Processing commit:', {
          type,
          message,
          hash,
        });
        hasContent = true;

        // Skip release-related commits
        if (
          type === 'chore' &&
          (message.toLowerCase().startsWith('prepare release') ||
            message.toLowerCase().startsWith('release version') ||
            message.toLowerCase().startsWith('update changelog') ||
            /^\(release\):/.test(message))
        ) {
          log.info('Skipping release commit:', message);
          return;
        }

        const formattedMessage = `- ${message.trim()} ([${type}](${url}))`;

        switch (type) {
          case 'feat':
            groups['Features'].push(formattedMessage);
            break;
          case 'fix':
            groups['Bug Fixes'].push(formattedMessage);
            break;
          case 'perf':
            groups['Performance'].push(formattedMessage);
            break;
          case 'break':
            groups['Breaking Changes'].push(formattedMessage);
            break;
          case 'docs':
            groups['Documentation'].push(formattedMessage);
            break;
          case 'chore':
            groups['Chores'].push(formattedMessage);
            break;
        }
      } else {
        log.info('Unmatched commit:', commit);
      }
    });

    if (!hasContent) {
      throw new Error(
        'No conventional commits found. Make sure your commits follow the format:\n' +
          '- feat: new feature\n' +
          '- fix: bug fix\n' +
          '- perf: performance improvement\n' +
          '- docs: documentation update\n' +
          '- chore: maintenance'
      );
    }

    // Format changelog - only include sections with content
    let changelog = '';
    try {
      log.info('Formatting changelog...');
      log.info(
        'Groups with content:',
        Object.entries(groups)
          .filter(([, items]) => items.length > 0)
          .map(([group]) => group)
      );

      for (const [group, items] of Object.entries(groups)) {
        if (items.length > 0) {
          log.info(`Adding ${items.length} items to ${group}`);
          changelog += `### ${group}\n\n${items.join('\n')}\n\n`;
        }
      }

      if (!changelog) {
        throw new Error('Generated changelog is empty after formatting');
      }

      log.info('Generated changelog length:', changelog.length);
      log.info('Generated changelog preview:', changelog.slice(0, 200));

      return changelog;
    } catch (error) {
      log.error('Error formatting changelog:', error);
      log.error('Groups state:', JSON.stringify(groups, null, 2));
      error.details = {
        ...error.details,
        groups,
        processedCommits: processedHashes.size,
      };
      throw error;
    }
  } catch (error) {
    // Añadir contexto al error
    error.details = {
      lastTag,
      repoUrl,
      cwd: process.cwd(),
      nodeVersion: process.version,
    };
    throw error;
  }
}

/**
 * Update CHANGELOG.md with new version
 * @param {string} version - New version number
 * @param {string} changes - Changelog content
 */
async function updateChangelog(version, changes) {
  const changelogPath = path.join(__dirname, '../CHANGELOG.md');
  const date = new Date().toISOString().split('T')[0];

  try {
    log.info('Updating changelog...');
    log.info('Version:', version);
    log.info('Date:', date);

    // Read existing changelog or create new one
    let changelog = '';
    try {
      log.info('Reading existing changelog...');
      changelog = await fsPromises.readFile(changelogPath, 'utf8');
      log.info('Existing changelog length:', changelog.length);
    } catch (error) {
      log.info('No existing changelog, creating new one');
      changelog = initializeChangelog(version);
    }

    // Add new version section
    log.info('Formatting new version section...');
    const newVersion = `## [${version}] - ${date}\n\n${changes}\n`;

    // Insert after the Unreleased section
    log.info('Inserting new version...');
    changelog = changelog.replace(/(## \[Unreleased\]\n\n)/, `$1${newVersion}`);

    // Update links
    const repoUrl = 'https://github.com/petalo/contracts-wizard';
    const links = `\n[Unreleased]: ${repoUrl}/compare/v${version}...HEAD\n[${version}]: ${repoUrl}/releases/tag/v${version}`;

    // Replace old links or add new ones
    if (changelog.includes('[Unreleased]:')) {
      changelog = changelog.replace(/\[Unreleased\]:.*(\n\[.*)?$/, links);
    } else {
      changelog += links;
    }

    log.info('Writing updated changelog...');
    log.info('New changelog length:', changelog.length);
    await fsPromises.writeFile(changelogPath, changelog);
    log.success('Updated CHANGELOG.md');
  } catch (error) {
    log.error('Failed to update changelog:', error);
    log.error('Error details:', {
      version,
      date,
      changelogPath,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Handle error logging based on error type
 * @param {Error} error - Error to handle
 * @param {boolean} [isFatal=false] - Whether this is a fatal error
 */
function handleError(error, isFatal = false) {
  const isExpectedError =
    error.message.includes('Working directory is not clean') ||
    error.message.includes('Must be on main') ||
    error.message.includes('Branch is not up to date') ||
    error.message.includes('Required file') ||
    error.message.includes('Cannot connect to GitHub');

  if (isExpectedError) {
    log.error(error.message);
  } else {
    log.error(`=== ${isFatal ? 'FATAL ' : ''}ERROR DETAILS ===`);
    log.error('Error message:', error.message);
    log.error('Error stack:', error.stack);
    log.error('Current working directory:', process.cwd());
    log.error('Node version:', process.version);
    if (error.code) log.error('Error code:', error.code);
    if (error.stdout) log.error('Command output:', error.stdout);
    if (error.stderr) log.error('Command error output:', error.stderr);
    log.error('='.repeat(isFatal ? 25 : 20));
  }
}

/**
 * Calculate next version number based on current version and type
 * @param {string} currentVersion - Current version from package.json
 * @param {'major'|'minor'|'patch'} type - Type of version bump
 * @returns {string} Next version number
 */
function calculateNextVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Validate changes and suggest version type
 * @param {string} changes - Generated changelog content
 * @param {string} type - Requested version type
 * @returns {void}
 * @throws {Error} If version type is inappropriate for changes
 */
function validateChangesAndType(changes, type) {
  log.info('Validating changes and version type...');

  // Add more robust version validation
  const hasBreakingChanges = changes.includes('### BREAKING CHANGES');
  const hasNewFeatures = changes.includes('### Features');
  const hasBugFixes = changes.includes('### Bug Fixes');

  // Enhanced validation with detailed logging
  log.info('Change analysis:', {
    hasBreakingChanges,
    hasNewFeatures,
    hasBugFixes,
    requestedType: type,
  });

  // Only trivial changes (docs, chores, etc)
  const hasOnlyTrivialChanges =
    !hasBreakingChanges && !hasNewFeatures && !hasBugFixes;

  // Validate based on change type with improved error messages
  if (hasBreakingChanges && type !== 'major') {
    throw new Error(
      'Found breaking changes. Use major version instead of minor/patch.'
    );
  }

  if (hasNewFeatures && type === 'patch') {
    throw new Error(
      'Found new features. Use minor or major version instead of patch.'
    );
  }

  if (hasOnlyTrivialChanges && type !== 'patch') {
    throw new Error(
      'Only trivial changes found. Use patch version or add significant changes.'
    );
  }

  log.success('Changes and version type validated');
}

async function release(
  options = {
    type: 'patch',
    dryRun: false,
  }
) {
  try {
    log.info('Starting release process...');

    // Validate inputs first
    log.info('Validating inputs...');
    if (!['major', 'minor', 'patch'].includes(options.type)) {
      throw new Error('Invalid version type. Use: major, minor, or patch');
    }

    // Initial validations - moved GitHub checks first
    log.info('Validating repository state...');
    await validateRepository();

    // Check if there are significant changes BEFORE deciding if it's a patch
    log.info('Checking for significant changes...');
    let changes;
    try {
      changes = generateChangelog();
      log.info('Changes detected:', changes ? 'yes' : 'no');
    } catch (error) {
      log.error('Error generating changelog:', error);
      throw error;
    }

    if (!changes || changes.trim() === '') {
      throw new Error('No significant changes found since last version');
    }

    // Validate changes against requested version type
    log.info('Validating changes against version type...');
    try {
      validateChangesAndType(changes, options.type);
    } catch (error) {
      if (options.dryRun) {
        log.warning(error.message);
        return;
      }
      throw error;
    }

    // Read current version
    log.info('Reading package.json...');
    const pkg = JSON.parse(
      await fsPromises.readFile(path.join(__dirname, '../package.json'), 'utf8')
    );
    log.info('Current version:', pkg.version);

    // Calculate next version
    const nextVersion = calculateNextVersion(pkg.version, options.type);
    log.info('Next version will be:', nextVersion);

    if (options.dryRun) {
      log.info('Dry run completed');
      return;
    }

    // Test GitHub connectivity before making any changes
    log.info('Testing GitHub connectivity...');
    let retries = 3;
    while (retries > 0) {
      try {
        execSync('git push --dry-run', { stdio: 'inherit' });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(
            'Cannot connect to GitHub after 3 attempts. Please check your connection and try again.'
          );
        }
        log.warning(
          `Connection failed, retrying... (${retries} attempts left)`
        );
        // Wait 2 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (options.type === 'patch') {
      log.info('Creating patch version...');

      // Run tests before any changes
      log.info('Running tests...');
      execSync('npm test', { stdio: 'inherit' });

      // Update version in package.json
      log.info('Updating version...');
      execSync('npm run version:update', { stdio: 'inherit' });

      // Commit changes
      log.info('Committing changes...');
      execSync('git add .');
      execSync(`git commit -m "chore: prepare patch ${pkg.version}"`);

      // Push changes
      log.info('Pushing changes...');
      execSync('git push', { stdio: 'inherit' });

      log.success(`Patch ${pkg.version} prepared`);
      log.info('\nNext steps:');
      log.info('1. Changes will be included in next major/minor release');
      return;
    } else {
      // For major/minor versions
      log.info(`Creating ${options.type} version...`);

      // Re-read package.json to get latest version after patch
      const updatedPkg = JSON.parse(
        await fsPromises.readFile(
          path.join(__dirname, '../package.json'),
          'utf8'
        )
      );

      // Calculate new version from current version
      const newVersion = calculateNextVersion(updatedPkg.version, options.type);

      // Check if tag exists locally or remotely
      log.info('Checking version tag...');
      log.info(`Checking for tag v${newVersion}...`);

      try {
        // Check local tag
        log.info('Checking local tag...');
        execSync(`git rev-parse v${newVersion}`, { stdio: 'ignore' });
        throw new Error(
          `Tag v${newVersion} already exists locally. To fix this:\n\n` +
            '1. Delete the local tag:\n' +
            `   git tag -d v${newVersion}\n\n` +
            '2. Try the release again:\n' +
            `   node scripts/release.js --${options.type}`
        );
      } catch (error) {
        // Add detailed error logging
        log.info(`Local tag check error: ${error.message}`);
        log.info(`Error status: ${error.status}`);

        // Only proceed if the error is about the tag not existing
        if (error.status === 128) {
          log.info('Tag does not exist locally, proceeding...');
        } else {
          throw error;
        }
      }

      // Check remote tag
      try {
        log.info('Checking remote tag...');
        const result = execSync(
          `git ls-remote --tags origin refs/tags/v${newVersion}`,
          { encoding: 'utf8' }
        );
        if (result.trim() !== '') {
          throw new Error(
            `Tag v${newVersion} already exists in remote. To fix this:\n\n` +
              '1. Delete the remote tag:\n' +
              `   git push --delete origin v${newVersion}\n\n` +
              '2. Try the release again:\n' +
              `   node scripts/release.js --${options.type}`
          );
        }
        log.info('Tag does not exist in remote, proceeding...');
      } catch (error) {
        // Add detailed error logging
        log.info(`Remote tag check error: ${error.message}`);
        log.info(`Error status: ${error.status}`);

        if (error.status !== 0 && !error.message.includes('already exists')) {
          throw error;
        }
      }

      // Generate changelog first to validate there are changes
      log.info('Generating changelog...');
      const changes = generateChangelog();

      // Run tests before making any changes
      log.info('Running tests...');
      execSync('npm test', { stdio: 'inherit' });

      // Update package.json version
      log.info('Updating package.json version...');
      execSync(`npm version ${options.type} --no-git-tag-version`, {
        stdio: 'inherit',
      });

      // Update other files and changelog
      log.info('Updating versions and changelog...');
      execSync('npm run version:update', { stdio: 'inherit' });
      await updateChangelog(newVersion, changes);

      // Commit all changes in one go
      log.info('Committing changes...');
      execSync('git add .');
      execSync(
        `git commit -m "chore(release): ${newVersion}

- Update package.json version
- Update changelog
- Update version.js"`,
        { stdio: 'inherit' }
      );

      // Check if tag already exists
      log.info('Checking version tag...');
      try {
        execSync(`git rev-parse v${newVersion}`, { stdio: 'ignore' });
        throw new Error(
          `Tag v${newVersion} already exists. To fix this:\n\n` +
            '1. Delete the local tag:\n' +
            `   git tag -d v${newVersion}\n\n` +
            '2. Delete the remote tag:\n' +
            `   git push --delete origin v${newVersion}\n\n` +
            '3. Try the release again:\n' +
            `   node scripts/release.js --${options.type}`
        );
      } catch (error) {
        if (error.message.includes('already exists')) {
          throw error;
        }
        // If we get here, the tag doesn't exist (command failed) - which is what we want
        log.info('Creating version tag...');
        execSync(
          `git tag -a v${newVersion} -m "chore(release): version ${newVersion}"`,
          { stdio: 'inherit' }
        );
      }

      // Push changes and tags
      log.info('Pushing changes and tags...');
      execSync('git push && git push --tags', { stdio: 'inherit' });

      log.success(
        `${options.type.charAt(0).toUpperCase() + options.type.slice(1)} version ${newVersion} prepared and pushed`
      );
      log.info('\nNext steps:');
      log.info('1. GitHub Actions will automatically:');
      log.info('   - Create a GitHub Release');
      log.info('   - Publish to npm');
      log.info('2. Monitor the workflow at:');
      log.info('   https://github.com/petalo/contracts-wizard/actions');
    }
  } catch (error) {
    handleError(error);
    process.exit(1);
  }
}

/**
 * Generate changelog preview file
 * @param {string} newVersion - Next version number
 * @returns {Promise<void>}
 */
async function generateChangelogPreview(newVersion) {
  try {
    const changes = generateChangelog();
    const previewPath = path.join(__dirname, '../CHANGELOG.preview.md');

    // Create preview with current changelog content
    const currentChangelog = await fsPromises.readFile(
      path.join(__dirname, '../CHANGELOG.md'),
      'utf8'
    );

    const preview = currentChangelog.replace(
      '# Changelog\n\n',
      `# Changelog\n\n## [${newVersion}] - ${new Date().toISOString().split('T')[0]}\n\n${changes}---\n\n`
    );

    await fsPromises.writeFile(previewPath, preview);
    log.success(`Preview generated at ${previewPath}`);
  } catch (error) {
    if (error.message.includes('No changes found since last release')) {
      log.warning('No changes to preview.');
      log.info(error.message);
    } else {
      throw error;
    }
  }
}

/**
 * Initialize CHANGELOG.md with standard format
 * @param {string} version - Initial version number
 * @returns {string} Initial changelog content
 */
function initializeChangelog(version) {
  const date = new Date().toISOString().split('T')[0];
  const repoUrl = 'https://github.com/petalo/contracts-wizard';

  return `<!-- markdownlint-disable -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [${version}] - ${date}

Initial release with core functionality.

[Unreleased]: ${repoUrl}/compare/v${version}...HEAD
[${version}]: ${repoUrl}/releases/tag/v${version}
`;
}

// Main execution
const opts = program.opts();

// Determine release type
let type = 'patch'; // default
if (opts.major) type = 'major';
else if (opts.minor) type = 'minor';

// Wrap async operations in an async function
async function main() {
  try {
    if (opts.listCommits) {
      const lastTag = getLatestMajorMinorTag();
      const range = lastTag ? `${lastTag}..HEAD` : '';
      log.info(`\nCommits since ${lastTag || 'beginning'}:\n`);

      // Get commits with parsed format
      const commits = execSync(
        `git log ${range} --pretty=format:"%h||%s||%cr||%an"`,
        { encoding: 'utf8' }
      )
        .trim()
        .split('\n')
        .map((line) => line.split('||'));

      // Create table
      const table = new Table({
        head: ['Hash', 'Message', 'When', 'Author'],
        style: {
          head: [], // Disable colors for better compatibility
          border: [],
        },
        wordWrap: true,
        wrapOnWordBoundary: false,
      });

      // Add commits to table
      commits.forEach(([hash, message, date, author]) => {
        table.push([hash, message, date, author]);
      });

      // Print table
      log.info(table.toString());

      return;
    }
    if (opts.preview) {
      const pkg = JSON.parse(
        await fsPromises.readFile(
          path.join(__dirname, '../package.json'),
          'utf8'
        )
      );
      const newVersion = calculateNextVersion(pkg.version, type);
      await generateChangelogPreview(newVersion);
    } else if (opts.getChanges) {
      log.info(generateChangelog());
    } else {
      await release({
        type,
        dryRun: opts.dryRun,
      });
    }
  } catch (error) {
    handleError(error, true);
    process.exit(1);
  }
}

// Execute main function
main();

module.exports = {
  release,
  validateRepository,
  generateChangelog,
};
