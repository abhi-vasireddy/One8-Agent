import { supabaseAdmin } from '../config/supabase.js';

/**
 * Notification Engine — Multi-channel notification delivery (In-app, Realtime)
 * Powered reliably via Supabase Cloud
 */
export class NotificationEngine {
  /**
   * Helper: Ensure valid user ID exists in users table before referencing
   */
  static async getValidUserId(userId) {
    if (!userId) return null;
    const { data: u } = await supabaseAdmin.from('users').select('id').eq('id', userId).maybeSingle();
    return u?.id || null;
  }

  /**
   * Send an in-app notification to a user
   */
  static async send({ userId, type = 'info', title, body, entityType = null, entityId = null }) {
    if (!userId || !title) return null;

    try {
      const validUserId = await this.getValidUserId(userId);
      if (!validUserId) {
        console.warn(`[NotificationEngine] User ${userId} not found in users table, skipping notification`);
        return null;
      }

      const { data: created, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: validUserId,
          type,
          title,
          body: body || '',
          entity_type: entityType,
          entity_id: entityId,
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create in-app notification:', error.message);
        return null;
      }

      return {
        id: created.id,
        userId: created.user_id,
        type: created.type,
        title: created.title,
        body: created.body,
        entityType: created.entity_type,
        entityId: created.entity_id,
        isRead: created.is_read,
        createdAt: created.created_at,
      };
    } catch (err) {
      console.error('Failed to create in-app notification:', err.message);
      return null;
    }
  }

  /**
   * Get notifications for a user (unread first, sorted by created_at DESC)
   */
  static async getUserNotifications(userId, limit = 20) {
    if (!userId) return [];
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get notifications:', error.message);
        return [];
      }

      return (data || []).map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        body: n.body,
        entityType: n.entity_type,
        entityId: n.entity_id,
        isRead: n.is_read,
        createdAt: n.created_at,
      }));
    } catch (err) {
      console.error('Failed to get notifications:', err.message);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
      return null;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
      return false;
    }
  }
}
