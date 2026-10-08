import assert from 'assert';
import { FieldEngine } from '../../src/engines/field-engine.js';
import { WorkflowEngine } from '../../src/engines/workflow-engine.js';

console.log('--- Running Engine Unit Tests ---');

// 1. FieldEngine Tests
console.log('Testing FieldEngine...');

const requiredField = { name: 'gpa', label: 'GPA', fieldType: 'number', isRequired: true, validationRules: { min: 0, max: 4.0 } };
assert.strictEqual(FieldEngine.validateFieldValue(requiredField, null).valid, false, 'Should fail when required field is null');
assert.strictEqual(FieldEngine.validateFieldValue(requiredField, 3.85).valid, true, 'Should pass valid GPA');
assert.strictEqual(FieldEngine.validateFieldValue(requiredField, 4.5).valid, false, 'Should fail GPA exceeding max');

const dropdownField = { name: 'dept', label: 'Department', fieldType: 'dropdown', options: [{ label: 'CS', value: 'cs' }, { label: 'EE', value: 'ee' }] };
assert.strictEqual(FieldEngine.validateFieldValue(dropdownField, 'cs').valid, true, 'Should allow valid option');
assert.strictEqual(FieldEngine.validateFieldValue(dropdownField, 'invalid').valid, false, 'Should reject invalid option');

console.log('✓ FieldEngine passed all tests');

// 2. WorkflowEngine Condition Evaluation Tests
console.log('Testing WorkflowEngine conditions...');

assert.strictEqual(WorkflowEngine.evaluateCondition(3.9, '>=', 3.8), true, '3.9 >= 3.8 should be true');
assert.strictEqual(WorkflowEngine.evaluateCondition(3.5, '>=', 3.8), false, '3.5 >= 3.8 should be false');
assert.strictEqual(WorkflowEngine.evaluateCondition('computer science', 'contains', 'science'), true, 'contains should match substring');
assert.strictEqual(WorkflowEngine.evaluateCondition('approved', '==', 'approved'), true, 'equality should match');

console.log('✓ WorkflowEngine passed all tests');

console.log('--- All Engine Unit Tests Succeeded! ---');
