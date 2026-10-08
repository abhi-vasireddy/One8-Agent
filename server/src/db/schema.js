import { pgTable, uuid, text, varchar, boolean, integer, timestamp, jsonb, serial, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION TABLES — Metadata-driven, admin-configurable
// ═══════════════════════════════════════════════════════════════

// ─── College ───
export const colleges = pgTable('colleges', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  logo: text('logo'),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Campus ───
export const campuses = pgTable('campuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  collegeId: uuid('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  address: text('address'),
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Branch ───
export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  collegeId: uuid('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  campusId: uuid('campus_id').references(() => campuses.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Department ───
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  collegeId: uuid('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Pipeline ───
export const pipelines = pgTable('pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  collegeId: uuid('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  entityType: varchar('entity_type', { length: 100 }).default('request'),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 20 }),
  settings: jsonb('settings').default({}),
  slaConfig: jsonb('sla_config').default({}),
  notificationConfig: jsonb('notification_config').default({}),
  isActive: boolean('is_active').default(true).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Pipeline Stages ───
export const pipelineStages = pgTable('pipeline_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 20 }).default('#6366f1'),
  icon: varchar('icon', { length: 50 }),
  order: integer('order').notNull().default(0),
  settings: jsonb('settings').default({}),
  entryActions: jsonb('entry_actions').default([]),
  exitActions: jsonb('exit_actions').default([]),
  requiredFieldIds: jsonb('required_field_ids').default([]),
  slaHours: integer('sla_hours'),
  approvalRequired: boolean('approval_required').default(false),
  autoAssignmentConfig: jsonb('auto_assignment_config').default({}),
  isInitial: boolean('is_initial').default(false),
  isFinal: boolean('is_final').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Stage Transitions ───
export const stageTransitions = pgTable('stage_transitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id, { onDelete: 'cascade' }),
  fromStageId: uuid('from_stage_id').notNull().references(() => pipelineStages.id, { onDelete: 'cascade' }),
  toStageId: uuid('to_stage_id').notNull().references(() => pipelineStages.id, { onDelete: 'cascade' }),
  allowedRoleIds: jsonb('allowed_role_ids').default([]),
  conditions: jsonb('conditions').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Custom Fields ───
export const customFields = pgTable('custom_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  collegeId: uuid('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  description: text('description'),
  fieldType: varchar('field_type', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // user, request, pipeline, etc.
  isRequired: boolean('is_required').default(false),
  defaultValue: jsonb('default_value'),
  options: jsonb('options').default([]), // for dropdown, radio, multi-select
  validationRules: jsonb('validation_rules').default({}),
  placeholder: varchar('placeholder', { length: 255 }),
  order: integer('order').default(0),
  visibility: varchar('visibility', { length: 20 }).default('visible'), // visible, hidden, conditional
  isEditable: boolean('is_editable').default(true),
  isReadOnly: boolean('is_read_only').default(false),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Custom Field Values ───
export const customFieldValues = pgTable('custom_field_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  fieldId: uuid('field_id').notNull().references(() => customFields.id, { onDelete: 'cascade' }),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  value: jsonb('value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Pipeline Fields (join table) ───
export const pipelineFields = pgTable('pipeline_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id, { onDelete: 'cascade' }),
  fieldId: uuid('field_id').notNull().references(() => customFields.id, { onDelete: 'cascade' }),
  order: integer('order').default(0),
  isRequired: boolean('is_required').default(false),
  stageId: uuid('stage_id').references(() => pipelineStages.id, { onDelete: 'set null' }),
});

// ─── Roles ───
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  collegeId: uuid('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isSystem: boolean('is_system').default(false), // system roles can't be deleted
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Permissions ───
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  resourceType: varchar('resource_type', { length: 50 }).notNull(), // pipeline, stage, field, request, etc.
  resourceId: uuid('resource_id'), // null = all resources of this type
  actions: jsonb('actions').default({}), // { view, create, edit, delete, assign, approve }
  fieldPermissions: jsonb('field_permissions').default({}), // { fieldId: { view, edit } }
  conditions: jsonb('conditions').default({}), // { own_records, department, branch }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── User Roles ───
export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Workflows ───
export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  collegeId: uuid('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  triggerType: varchar('trigger_type', { length: 100 }).notNull(),
  triggerConfig: jsonb('trigger_config').default({}),
  nodes: jsonb('nodes').default([]),
  edges: jsonb('edges').default([]),
  isActive: boolean('is_active').default(true),
  version: integer('version').default(1),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Workflow Executions ───
export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  triggerEvent: jsonb('trigger_event').default({}),
  context: jsonb('context').default({}),
  status: varchar('status', { length: 30 }).default('pending').notNull(), // pending, running, completed, failed, cancelled
  currentNodeId: varchar('current_node_id', { length: 100 }),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  error: jsonb('error'),
});

// ─── Workflow Execution Logs ───
export const workflowExecutionLogs = pgTable('workflow_execution_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').notNull().references(() => workflowExecutions.id, { onDelete: 'cascade' }),
  nodeId: varchar('node_id', { length: 100 }).notNull(),
  nodeType: varchar('node_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 30 }).notNull(),
  input: jsonb('input').default({}),
  output: jsonb('output').default({}),
  error: text('error'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// ─── Automation Schedules ───
export const automationSchedules = pgTable('automation_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  cronExpression: varchar('cron_expression', { length: 100 }).notNull(),
  nextRunAt: timestamp('next_run_at'),
  lastRunAt: timestamp('last_run_at'),
  isActive: boolean('is_active').default(true),
  config: jsonb('config').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Forms ───
export const forms = pgTable('forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  collegeId: uuid('college_id').notNull().references(() => colleges.id, { onDelete: 'cascade' }),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id, { onDelete: 'set null' }),
  stageId: uuid('stage_id').references(() => pipelineStages.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  fieldIds: jsonb('field_ids').default([]),
  layout: jsonb('layout').default({}),
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Routing Rules ───
export const routingRules = pgTable('routing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id, { onDelete: 'cascade' }),
  conditions: jsonb('conditions').default({}),
  action: jsonb('action').default({}),
  priority: integer('priority').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── SLA Rules ───
export const slaRules = pgTable('sla_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull().references(() => pipelines.id, { onDelete: 'cascade' }),
  stageId: uuid('stage_id').references(() => pipelineStages.id, { onDelete: 'set null' }),
  hours: integer('hours').notNull(),
  escalationConfig: jsonb('escalation_config').default({}),
  notificationConfig: jsonb('notification_config').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Audit Logs ───
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id'),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  ipAddress: varchar('ip_address', { length: 45 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});


// ═══════════════════════════════════════════════════════════════
// CORE ENTITY TABLES
// ═══════════════════════════════════════════════════════════════

// ─── Users ───
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authId: varchar('auth_id', { length: 255 }).unique(), // Supabase Auth UID
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatarUrl: text('avatar_url'),
  collegeId: uuid('college_id').references(() => colleges.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').default(true).notNull(),
  lastLogin: timestamp('last_login'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Requests ───
export const requests = pgTable('requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestNumber: varchar('request_number', { length: 50 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  pipelineId: uuid('pipeline_id').references(() => pipelines.id, { onDelete: 'set null' }),
  stageId: uuid('stage_id').references(() => pipelineStages.id, { onDelete: 'set null' }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  assignedUserId: uuid('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
  assignedRoleId: uuid('assigned_role_id').references(() => roles.id, { onDelete: 'set null' }),
  customFieldValues: jsonb('custom_field_values').default({}),
  workflowState: jsonb('workflow_state').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Request Status History ───
export const requestStatusHistory = pgTable('request_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').notNull().references(() => requests.id, { onDelete: 'cascade' }),
  fromStageId: uuid('from_stage_id').references(() => pipelineStages.id),
  toStageId: uuid('to_stage_id').references(() => pipelineStages.id),
  changedBy: uuid('changed_by').references(() => users.id),
  reason: text('reason'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// ─── Conversations ───
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').references(() => requests.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).default('ai').notNull(), // ai, human, system
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Messages ───
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderType: varchar('sender_type', { length: 20 }).notNull(), // user, ai, system
  senderId: uuid('sender_id'),
  content: text('content').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Notifications ───
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


// ═══════════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════════

export const collegesRelations = relations(colleges, ({ many }) => ({
  campuses: many(campuses),
  branches: many(branches),
  departments: many(departments),
  pipelines: many(pipelines),
  roles: many(roles),
  users: many(users),
  customFields: many(customFields),
  workflows: many(workflows),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  college: one(colleges, { fields: [branches.collegeId], references: [colleges.id] }),
  campus: one(campuses, { fields: [branches.campusId], references: [campuses.id] }),
  pipelines: many(pipelines),
}));

export const pipelinesRelations = relations(pipelines, ({ one, many }) => ({
  college: one(colleges, { fields: [pipelines.collegeId], references: [colleges.id] }),
  branch: one(branches, { fields: [pipelines.branchId], references: [branches.id] }),
  department: one(departments, { fields: [pipelines.departmentId], references: [departments.id] }),
  stages: many(pipelineStages),
  fields: many(pipelineFields),
  workflows: many(workflows),
  requests: many(requests),
}));

export const pipelineStagesRelations = relations(pipelineStages, ({ one }) => ({
  pipeline: one(pipelines, { fields: [pipelineStages.pipelineId], references: [pipelines.id] }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  college: one(colleges, { fields: [roles.collegeId], references: [colleges.id] }),
  permissions: many(permissions),
  userRoles: many(userRoles),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  college: one(colleges, { fields: [users.collegeId], references: [colleges.id] }),
  userRoles: many(userRoles),
  notifications: many(notifications),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  pipeline: one(pipelines, { fields: [requests.pipelineId], references: [pipelines.id] }),
  stage: one(pipelineStages, { fields: [requests.stageId], references: [pipelineStages.id] }),
  branch: one(branches, { fields: [requests.branchId], references: [branches.id] }),
  creator: one(users, { fields: [requests.createdBy], references: [users.id], relationName: 'creator' }),
  assignedUser: one(users, { fields: [requests.assignedUserId], references: [users.id], relationName: 'assignedUser' }),
  statusHistory: many(requestStatusHistory),
  conversations: many(conversations),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  college: one(colleges, { fields: [workflows.collegeId], references: [colleges.id] }),
  branch: one(branches, { fields: [workflows.branchId], references: [branches.id] }),
  pipeline: one(pipelines, { fields: [workflows.pipelineId], references: [pipelines.id] }),
  executions: many(workflowExecutions),
}));
