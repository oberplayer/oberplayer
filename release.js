const { spawnSync } = require('child_process');

// Exécuter `npm install` dans le répertoire courant pour avoir semver
const result = spawnSync('npm', ['install'], { stdio: 'inherit' });

// Gérer les erreurs éventuelles
if (result.error) {
  console.error('Erreur lors de l\'installation:', result.error);
  process.exit(1);
}

const semver = require('semver');
const { argv } = require('yargs');
const { version } = require('./package.json');

// Check if the github username and token are defined
if (process.env.GITHUB_USER_TOKEN === undefined || process.env.OBERPLAYER_NPM_TOKEN === undefined) {
  console.error('Env variable GITHUB_USER_TOKEN or OBERPLAYER_NPM_TOKEN not found');
  process.exit(1);
}

const nextVersion = argv['release-as'];
const finalVersion = semver.valid(semver.coerce(nextVersion));
const isPrerelease = semver.prerelease(nextVersion) !== null;
const releaseBranch = `release/${finalVersion}`;

if (!nextVersion) {
  throw new Error('missing version arg');
}
console.log('------------------------------------------------------------');
console.log('!!! Published version will be', nextVersion, '!!!');
console.log('------------------------------------------------------------');
console.log('current version:', version, 'nextVersion:', nextVersion, 'finalVersion:', finalVersion, 'isPrerelease:', isPrerelease, 'releaseBranch:', releaseBranch);
console.log('------------------------------------------------------------');

const commandArray = [
  `npm version ${nextVersion} --no-git-tag-version`,
  `npm run build`,
  `npm run lint`,
  `npm publish --access public`,

  // create release branch if needed
  `git checkout ${releaseBranch} || git checkout -b ${releaseBranch}`,

  //////////////////////////////////// now commit and push everything
  'git add .',
  `git commit --no-verify -m "chore(${isPrerelease ? 'pre' : ''}release): ${nextVersion}"`,

  `git push origin HEAD:${releaseBranch}`,

  // <-- RELEASE ONLY, WE CAN MERGE DELETE BRANCHES AND TAG
  // checkout main
  isPrerelease ? '' : 'git checkout main',
  // merge release into main
  isPrerelease ? '' : `git merge ${releaseBranch}`,
  // push main (will merge the PR)
  isPrerelease ? '' : 'git push origin HEAD',
  // return back to main to send tag at the end
  isPrerelease ? '' : 'git checkout main',
  // delete local branch
  isPrerelease ? '' : `git branch -D ${releaseBranch}`,
  // delete remote branch
  isPrerelease ? '' : `git push origin --delete ${releaseBranch}`,

  isPrerelease ? '' : `git tag -a v${nextVersion} -m "version ${nextVersion}"`,
  isPrerelease ? '' : `git push origin v${nextVersion}`,

  // merge back in develop at the very end of the process
  isPrerelease ? '' : 'git checkout -b develop',
  isPrerelease ? '' : 'git merge main',
  isPrerelease ? '' : 'git push origin HEAD',
];

commandArray.forEach((commandToExecute) => {
  if (commandToExecute === '') {
    return;
  }
  try {
    console.log(`\x1b[0;32m${commandToExecute}`);
    const exitCode = spawnSync('/bin/sh', ['-c', commandToExecute], { stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(`\x1b[0m${exitCode.stdout.toString()}`);
    if (exitCode.status !== 0) {
      console.error(`\x1b[0;31m${exitCode.stderr.toString()}`);
      process.exit();
    }
  } catch (error) {
    console.log('Error', error);
  }
});
