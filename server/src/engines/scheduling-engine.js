import cron from 'node-cron';
import { db } from '../config/database.js';
import { automationSchedules, workflows } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { WorkflowEngine } from './workflow-engine.js';

/**
 * Scheduling Engine — Cron automation scheduler for recurring college workflows
 */
export class SchedulingEngine {
  static tasks = new Map();

  /**
   * Initialize and register all active cron schedules from the database
   */
  static async init() {
    try {
      const activeSchedules = await db
        .select()
        .from(automationSchedules)
        .where(eq(automationSchedules.isActive, true));

      for (const item of activeSchedules) {
        this.scheduleJob(item);
      }

      console.log(`[SchedulingEngine] Initialized ${activeSchedules.length} active scheduled automations.`);
    } catch (err) {
      console.warn('[SchedulingEngine] Could not load schedules (database might not be connected yet):', err.message);
    }
  }

  /**
   * Register a cron job
   */
  static scheduleJob(scheduleRecord) {
    const { id, workflowId, cronExpression } = scheduleRecord;

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      console.error(`[SchedulingEngine] Invalid cron expression '${cronExpression}' for schedule ${id}`);
      return;
    }

    // Stop existing task if already running
    if (this.tasks.has(id)) {
      this.tasks.get(id).stop();
    }

    const task = cron.schedule(cronExpression, async () => {
      console.log(`[SchedulingEngine] Triggering scheduled workflow: ${workflowId}`);
      try {
        await WorkflowEngine.executeWorkflow(workflowId, {
          scheduleId: id,
          scheduledRun: true,
        }, {
          eventType: 'scheduled',
          cron: cronExpression,
        });

        // Update last run timestamp
        await db
          .update(automationSchedules)
          .set({ lastRunAt: new Date(), updatedAt: new Date() })
          .where(eq(automationSchedules.id, id));
      } catch (err) {
        console.error(`[SchedulingEngine] Execution error for schedule ${id}:`, err.message);
      }
    });

    this.tasks.set(id, task);
  }

  /**
   * Stop all running schedules
   */
  static stopAll() {
    for (const [id, task] of this.tasks.entries()) {
      task.stop();
    }
    this.tasks.clear();
  }
}
