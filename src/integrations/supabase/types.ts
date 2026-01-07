export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          performed_by: string
          target_role: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          performed_by: string
          target_role?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          performed_by?: string
          target_role?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          barber_id: string
          client_id: string
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          notification_sent: boolean | null
          service_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          barber_id: string
          client_id: string
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          notification_sent?: boolean | null
          service_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          barber_id?: string
          client_id?: string
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          notification_sent?: boolean | null
          service_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          client_id: string
          created_at: string
          error_message: string | null
          id: string
          message: string
          phone: string
          sent_at: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          phone: string
          sent_at?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          phone?: string
          sent_at?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_settings: {
        Row: {
          created_at: string
          id: string
          inactive_clients_enabled: boolean
          inactive_clients_message: string
          inactive_days_threshold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inactive_clients_enabled?: boolean
          inactive_clients_message?: string
          inactive_days_threshold?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inactive_clients_enabled?: boolean
          inactive_clients_message?: string
          inactive_days_threshold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      barber_breaks: {
        Row: {
          barber_id: string
          break_type: string
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          start_time: string
          weekday: number
        }
        Insert: {
          barber_id: string
          break_type?: string
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          start_time: string
          weekday: number
        }
        Update: {
          barber_id?: string
          break_type?: string
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "barber_breaks_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_exceptions: {
        Row: {
          barber_id: string
          created_at: string | null
          date: string
          id: string
          is_closed: boolean | null
          note: string | null
        }
        Insert: {
          barber_id: string
          created_at?: string | null
          date: string
          id?: string
          is_closed?: boolean | null
          note?: string | null
        }
        Update: {
          barber_id?: string
          created_at?: string | null
          date?: string
          id?: string
          is_closed?: boolean | null
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_exceptions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_goals: {
        Row: {
          barber_id: string
          created_at: string
          current_avg_ticket: number
          current_haircuts: number
          current_product_sales: number
          id: string
          target_avg_ticket: number
          target_haircuts: number
          target_product_sales: number
          updated_at: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          barber_id: string
          created_at?: string
          current_avg_ticket?: number
          current_haircuts?: number
          current_product_sales?: number
          id?: string
          target_avg_ticket?: number
          target_haircuts?: number
          target_product_sales?: number
          updated_at?: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          barber_id?: string
          created_at?: string
          current_avg_ticket?: number
          current_haircuts?: number
          current_product_sales?: number
          id?: string
          target_avg_ticket?: number
          target_haircuts?: number
          target_product_sales?: number
          updated_at?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_goals_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_work_hours: {
        Row: {
          barber_id: string
          created_at: string | null
          end_time: string
          id: string
          start_time: string
          weekday: number
        }
        Insert: {
          barber_id: string
          created_at?: string | null
          end_time: string
          id?: string
          start_time: string
          weekday: number
        }
        Update: {
          barber_id?: string
          created_at?: string | null
          end_time?: string
          id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "barber_work_hours_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          avatar_url: string | null
          commission_percentage: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string | null
          specialty: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          commission_percentage?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug?: string | null
          specialty?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          commission_percentage?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string | null
          specialty?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cash_register_sessions: {
        Row: {
          closed_at: string | null
          closing_amount: number | null
          created_at: string
          id: string
          is_open: boolean
          notes: string | null
          opened_at: string
          opening_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          closing_amount?: number | null
          created_at?: string
          id?: string
          is_open?: boolean
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          closing_amount?: number | null
          created_at?: string
          id?: string
          is_open?: boolean
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cash_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          description: string
          id: string
          session_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string
          description: string
          id?: string
          session_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          description?: string
          id?: string
          session_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_register_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_announcement_views: {
        Row: {
          announcement_id: string
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          announcement_id: string
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          announcement_id?: string
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_announcement_views_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "feature_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_announcements: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_premium_only: boolean | null
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_premium_only?: boolean | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_premium_only?: boolean | null
          title?: string
        }
        Relationships: []
      }
      feature_waitlist: {
        Row: {
          created_at: string
          email: string
          feature_name: string
          id: string
          notified_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          feature_name: string
          id?: string
          notified_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          feature_name?: string
          id?: string
          notified_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      generated_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_public: boolean | null
          metadata: Json | null
          post_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          metadata?: Json | null
          post_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          metadata?: Json | null
          post_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      help_article_feedback: {
        Row: {
          article_id: string
          category_id: string
          created_at: string
          feedback_reason: string | null
          id: string
          is_helpful: boolean
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          article_id: string
          category_id: string
          created_at?: string
          feedback_reason?: string | null
          id?: string
          is_helpful: boolean
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string
          category_id?: string
          created_at?: string
          feedback_reason?: string | null
          id?: string
          is_helpful?: boolean
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ip_fraud_logs: {
        Row: {
          attempt_date: string
          created_at: string
          device_id: string | null
          id: string
          ip_address: string
          reason: string | null
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempt_date?: string
          created_at?: string
          device_id?: string | null
          id?: string
          ip_address: string
          reason?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_date?: string
          created_at?: string
          device_id?: string | null
          id?: string
          ip_address?: string
          reason?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          available_points: number
          created_at: string
          id: string
          lifetime_points: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_points?: number
          created_at?: string
          id?: string
          lifetime_points?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_points?: number
          created_at?: string
          id?: string
          lifetime_points?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          cashback_value: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          points_required: number
        }
        Insert: {
          cashback_value: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_required: number
        }
        Update: {
          cashback_value?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_required?: number
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          appointment_id: string | null
          created_at: string
          description: string
          id: string
          points: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          description: string
          id?: string
          points: number
          transaction_type: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          description?: string
          id?: string
          points?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_name: string
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          service_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          client_name: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          service_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          service_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_sales: {
        Row: {
          appointment_id: string | null
          barber_id: string
          client_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          sale_date: string
          total_price: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          barber_id: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          sale_date?: string
          total_price: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string
          client_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          sale_date?: string
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_sales_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          min_stock_level: number
          name: string
          price: number
          stock_quantity: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock_level?: number
          name: string
          price: number
          stock_quantity?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock_level?: number
          name?: string
          price?: number
          stock_quantity?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activated_at: string | null
          activation_completed: boolean | null
          activation_source: string | null
          barbershop_logo_url: string | null
          barbershop_name: string
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          reminder_template: string | null
        }
        Insert: {
          activated_at?: string | null
          activation_completed?: boolean | null
          activation_source?: string | null
          barbershop_logo_url?: string | null
          barbershop_name?: string
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          reminder_template?: string | null
        }
        Update: {
          activated_at?: string | null
          activation_completed?: boolean | null
          activation_source?: string | null
          barbershop_logo_url?: string | null
          barbershop_name?: string
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          reminder_template?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pwa_analytics: {
        Row: {
          created_at: string
          device_id: string | null
          event_type: string
          id: string
          platform: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          event_type: string
          id?: string
          platform?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          event_type?: string
          id?: string
          platform?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      redirect_analytics: {
        Row: {
          created_at: string
          id: string
          redirect_type: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          redirect_type: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          redirect_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          end_date: string
          id: string
          origin_device_id: string | null
          origin_ip: string | null
          plan_type: string
          start_date: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          end_date: string
          id?: string
          origin_device_id?: string | null
          origin_ip?: string | null
          plan_type: string
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          end_date?: string
          id?: string
          origin_device_id?: string | null
          origin_ip?: string | null
          plan_type?: string
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          app_version: string | null
          created_at: string
          device_id: string | null
          email: string
          id: string
          mensagem: string
          nome: string
          plano: string
          status: string
          tipo: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_id?: string | null
          email: string
          id?: string
          mensagem: string
          nome: string
          plano?: string
          status?: string
          tipo: string
          user_id: string
          whatsapp: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_id?: string | null
          email?: string
          id?: string
          mensagem?: string
          nome?: string
          plano?: string
          status?: string
          tipo?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: []
      }
      trial_feedback: {
        Row: {
          created_at: string
          id: string
          improvement_suggestion: string | null
          liked_features: string[] | null
          plan_type: string | null
          rating: number
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          improvement_suggestion?: string | null
          liked_features?: string[] | null
          plan_type?: string | null
          rating: number
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          improvement_suggestion?: string | null
          liked_features?: string[] | null
          plan_type?: string | null
          rating?: number
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_settings: {
        Row: {
          api_token: string | null
          api_url: string | null
          appointment_message_template: string | null
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          api_token?: string | null
          api_url?: string | null
          appointment_message_template?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          api_token?: string | null
          api_url?: string | null
          appointment_message_template?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      help_article_stats: {
        Row: {
          article_id: string | null
          category_id: string | null
          helpful_count: number | null
          helpful_percentage: number | null
          not_helpful_count: number | null
          total_feedback: number | null
        }
        Relationships: []
      }
      ip_fraud_stats: {
        Row: {
          blocked_attempts: number | null
          first_attempt: string | null
          ip_address: string | null
          last_attempt: string | null
          successful_registrations: number | null
          total_attempts: number | null
          unique_devices: number | null
          warnings: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_complete_appointments: { Args: never; Returns: undefined }
      check_free_eligibility: {
        Args: { p_device_id?: string; p_ip_address: string }
        Returns: {
          active_freemium_count_device: number
          active_freemium_count_ip: number
          allowed: boolean
          reason: string
          recent_attempts: number
        }[]
      }
      check_login_allowed: {
        Args: { p_email: string; p_ip?: string }
        Returns: {
          allowed: boolean
          locked_until: string
          reason: string
          remaining_attempts: number
        }[]
      }
      check_time_slot_available: {
        Args: {
          p_barber_id: string
          p_date: string
          p_duration_minutes: number
          p_time: string
        }
        Returns: boolean
      }
      create_appointment_safe: {
        Args: {
          p_appointment_date: string
          p_appointment_time: string
          p_barber_id: string
          p_customer_name: string
          p_customer_phone: string
          p_duration_minutes: number
          p_service_id: string
        }
        Returns: string
      }
      create_profile:
        | { Args: never; Returns: undefined }
        | {
            Args: { full_name: string; papel: string; telefone: string }
            Returns: undefined
          }
      generate_barber_slug: { Args: { barber_name: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_login_attempt: {
        Args: { p_email: string; p_ip?: string; p_success: boolean }
        Returns: undefined
      }
      update_barber_goals_progress: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "client" | "barber"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "client", "barber"],
    },
  },
} as const
