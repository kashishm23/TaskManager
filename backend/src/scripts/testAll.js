const { execSync } = require('child_process');
const path = require('path');

// List of all step-specific verification test scripts
const testScripts = [
  'testAuth.js',
  'testRbac.js',
  'testProjects.js',
  'testTasks.js',
  'testValidation.js',
  'testDashboard.js'
];

console.log('============================================================');
console.log('           TEAM TASK MANAGER - BACKEND TEST RUNNER          ');
console.log('============================================================');

let hasFailures = false;

testScripts.forEach(scriptFile => {
  console.log(`\n[Test Runner] Executing: ${scriptFile}...`);
  try {
    // Run script in a child process forwarding stdout/stderr to console
    execSync(`node "${path.join(__dirname, scriptFile)}"`, { stdio: 'inherit' });
    console.log(`[Test Runner] SUCCESS: ${scriptFile} passed.`);
  } catch (error) {
    console.error(`[Test Runner] FAILURE: ${scriptFile} failed.`);
    hasFailures = true;
  }
});

console.log('\n============================================================');
if (hasFailures) {
  console.error('             WARNING: SOME TEST SUITES FAILED!              ');
  console.log('============================================================');
  process.exit(1);
} else {
  console.log('         CONGRATULATIONS: ALL BACKEND TEST SUITES PASSED!   ');
  console.log('============================================================');
}
