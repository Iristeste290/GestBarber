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
      app_update_views: {
        Row: {
          id: string
          update_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          update_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          update_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_update_views_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "app_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      app_updates: {
        Row: {
          created_at: string
          description: string
          emoji: string | null
          id: string
          is_active: boolean | null
          title: string
          version: string | null
        }
        Insert: {
          created_at?: string
          description: string
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          version?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          version?: string | null
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
            referencedRelation: "barber_barbershop_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_services_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_site_barbers_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "barbershop_public_info"
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
            referencedRelation: "barber_services_public"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "barber_site_services_public"
            referencedColumns: ["service_id"]
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
            referencedRelation: "barber_barbershop_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_breaks_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_services_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_breaks_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_site_barbers_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_breaks_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_breaks_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers_public"
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
            referencedRelation: "barber_barbershop_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_exceptions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_services_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_exceptions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_site_barbers_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_exceptions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_exceptions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers_public"
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
            referencedRelation: "barber_barbershop_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_goals_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_services_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_goals_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_site_barbers_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_goals_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_goals_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_score: {
        Row: {
          barber_id: string
          cancel_rate: number
          canceled_appointments: number
          completed_appointments: number
          created_at: string
          id: string
          last_update: string
          no_show_clients: number
          revenue: number
          score: number
          total_appointments: number
          user_id: string
        }
        Insert: {
          barber_id: string
          cancel_rate?: number
          canceled_appointments?: number
          completed_appointments?: number
          created_at?: string
          id?: string
          last_update?: string
          no_show_clients?: number
          revenue?: number
          score?: number
          total_appointments?: number
          user_id: string
        }
        Update: {
          barber_id?: string
          cancel_rate?: number
          canceled_appointments?: number
          completed_appointments?: number
          created_at?: string
          id?: string
          last_update?: string
          no_show_clients?: number
          revenue?: number
          score?: number
          total_appointments?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_score_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: true
            referencedRelation: "barber_barbershop_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_score_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: true
            referencedRelation: "barber_services_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_score_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: true
            referencedRelation: "barber_site_barbers_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_score_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: true
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_score_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: true
            referencedRelation: "barbers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_sites: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          phone: string | null
          published: boolean | null
          seo_data: Json | null
          site_content: Json | null
          slug: string
          theme: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          phone?: string | null
          published?: boolean | null
          seo_data?: Json | null
          site_content?: Json | null
          slug: string
          theme?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          phone?: string | null
          published?: boolean | null
          seo_data?: Json | null
          site_content?: Json | null
          slug?: string
          theme?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
            referencedRelation: "barber_barbershop_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_work_hours_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_services_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_work_hours_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_site_barbers_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_work_hours_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_work_hours_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers_public"
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
      barbershop_leads: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string
          site_id: string | null
          source: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          site_id?: string | null
          source?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          site_id?: string | null
          source?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barbershop_leads_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "barber_site_barbers_public"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "barbershop_leads_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "barber_site_services_public"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "barbershop_leads_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "barber_site_stats_public"
            referencedColumns: ["site_id"]
          },
          {
            foreignKeyName: "barbershop_leads_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "barber_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barbershop_leads_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "barber_sites_public"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershop_performance: {
        Row: {
          appointments_count: number | null
          avg_ticket: number | null
          calculated_at: string
          clients_count: number | null
          created_at: string
          id: string
          no_show_rate: number | null
          occupancy_rate: number | null
          performance_percentile: number | null
          performance_score: number | null
          retention_rate: number | null
          total_revenue: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointments_count?: number | null
          avg_ticket?: number | null
          calculated_at?: string
          clients_count?: number | null
          created_at?: string
          id?: string
          no_show_rate?: number | null
          occupancy_rate?: number | null
          performance_percentile?: number | null
          performance_score?: number | null
          retention_rate?: number | null
          total_revenue?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointments_count?: number | null
          avg_ticket?: number | null
          calculated_at?: string
          clients_count?: number | null
          created_at?: string
          id?: string
          no_show_rate?: number | null
          occupancy_rate?: number | null
          performance_percentile?: number | null
          performance_score?: number | null
          retention_rate?: number | null
          total_revenue?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      barbershop_website: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_published: boolean | null
          photos: string[] | null
          published_at: string | null
          services_highlight: string[] | null
          site_content: Json | null
          site_description: string | null
          site_name: string | null
          site_style: string | null
          site_url: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          photos?: string[] | null
          published_at?: string | null
          services_highlight?: string[] | null
          site_content?: Json | null
          site_description?: string | null
          site_name?: string | null
          site_style?: string | null
          site_url?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          photos?: string[] | null
          published_at?: string | null
          services_highlight?: string[] | null
          site_content?: Json | null
          site_description?: string | null
          site_name?: string | null
          site_style?: string | null
          site_url?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      booking_attempts: {
        Row: {
          abandoned_at: string | null
          completed_at: string | null
          created_at: string
          device_type: string | null
          id: string
          session_id: string
          started_at: string
          step_reached: string
          user_id: string
        }
        Insert: {
          abandoned_at?: string | null
          completed_at?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          session_id: string
          started_at?: string
          step_reached?: string
          user_id: string
        }
        Update: {
          abandoned_at?: string | null
          completed_at?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          session_id?: string
          started_at?: string
          step_reached?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_rules: {
        Row: {
          auto_block_risk: boolean | null
          created_at: string
          deposit_amount: number | null
          id: string
          min_score_no_confirmation: number | null
          require_confirmation: boolean | null
          require_deposit: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_block_risk?: boolean | null
          created_at?: string
          deposit_amount?: number | null
          id?: string
          min_score_no_confirmation?: number | null
          require_confirmation?: boolean | null
          require_deposit?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_block_risk?: boolean | null
          created_at?: string
          deposit_amount?: number | null
          id?: string
          min_score_no_confirmation?: number | null
          require_confirmation?: boolean | null
          require_deposit?: boolean | null
          updated_at?: string
          user_id?: string
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
            foreignKeyName: "cash_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_public_safe"
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
      client_behavior: {
        Row: {
          attended_count: number | null
          cancel_rate: number
          canceled: number
          city: string | null
          classification: string
          client_id: string
          client_name: string | null
          client_phone: string | null
          completed: number
          created_at: string
          customer_score: number | null
          customer_status: string | null
          id: string
          last_appointment_date: string | null
          last_update: string
          latitude: number | null
          longitude: number | null
          months_as_client: number | null
          neighborhood: string | null
          no_show: number
          postal_code: string | null
          rescheduled_count: number | null
          total_appointments: number
          user_id: string
        }
        Insert: {
          attended_count?: number | null
          cancel_rate?: number
          canceled?: number
          city?: string | null
          classification?: string
          client_id: string
          client_name?: string | null
          client_phone?: string | null
          completed?: number
          created_at?: string
          customer_score?: number | null
          customer_status?: string | null
          id?: string
          last_appointment_date?: string | null
          last_update?: string
          latitude?: number | null
          longitude?: number | null
          months_as_client?: number | null
          neighborhood?: string | null
          no_show?: number
          postal_code?: string | null
          rescheduled_count?: number | null
          total_appointments?: number
          user_id: string
        }
        Update: {
          attended_count?: number | null
          cancel_rate?: number
          canceled?: number
          city?: string | null
          classification?: string
          client_id?: string
          client_name?: string | null
          client_phone?: string | null
          completed?: number
          created_at?: string
          customer_score?: number | null
          customer_status?: string | null
          id?: string
          last_appointment_date?: string | null
          last_update?: string
          latitude?: number | null
          longitude?: number | null
          months_as_client?: number | null
          neighborhood?: string | null
          no_show?: number
          postal_code?: string | null
          rescheduled_count?: number | null
          total_appointments?: number
          user_id?: string
        }
        Relationships: []
      }
      empty_slots: {
        Row: {
          barber_id: string
          created_at: string
          id: string
          slot_date: string
          slot_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          barber_id: string
          created_at?: string
          id?: string
          slot_date: string
          slot_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          barber_id?: string
          created_at?: string
          id?: string
          slot_date?: string
          slot_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empty_slots_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_barbershop_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "empty_slots_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_services_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "empty_slots_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_site_barbers_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "empty_slots_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empty_slots_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers_public"
            referencedColumns: ["id"]
          },
        ]
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
      google_business_connection: {
        Row: {
          access_token: string | null
          account_name: string | null
          business_id: string | null
          created_at: string
          id: string
          is_connected: boolean | null
          last_sync_at: string | null
          location_name: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_name?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          location_name?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_name?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          location_name?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_business_metrics: {
        Row: {
          average_rating: number | null
          created_at: string
          direction_requests: number | null
          id: string
          metric_date: string
          phone_calls: number | null
          reviews_count: number | null
          searches_count: number | null
          unanswered_reviews: number | null
          user_id: string
          views_count: number | null
          website_clicks: number | null
        }
        Insert: {
          average_rating?: number | null
          created_at?: string
          direction_requests?: number | null
          id?: string
          metric_date?: string
          phone_calls?: number | null
          reviews_count?: number | null
          searches_count?: number | null
          unanswered_reviews?: number | null
          user_id: string
          views_count?: number | null
          website_clicks?: number | null
        }
        Update: {
          average_rating?: number | null
          created_at?: string
          direction_requests?: number | null
          id?: string
          metric_date?: string
          phone_calls?: number | null
          reviews_count?: number | null
          searches_count?: number | null
          unanswered_reviews?: number | null
          user_id?: string
          views_count?: number | null
          website_clicks?: number | null
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
      lost_revenue: {
        Row: {
          appointment_id: string | null
          barber_id: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          lost_date: string
          reason: string
          service_name: string | null
          slot_time: string | null
          user_id: string
          value_lost: number
        }
        Insert: {
          appointment_id?: string | null
          barber_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          lost_date?: string
          reason: string
          service_name?: string | null
          slot_time?: string | null
          user_id: string
          value_lost?: number
        }
        Update: {
          appointment_id?: string | null
          barber_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          lost_date?: string
          reason?: string
          service_name?: string | null
          slot_time?: string | null
          user_id?: string
          value_lost?: number
        }
        Relationships: [
          {
            foreignKeyName: "lost_revenue_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_barbershop_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "lost_revenue_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_services_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "lost_revenue_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_site_barbers_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "lost_revenue_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_revenue_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers_public"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "loyalty_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_public_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_process_logs: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          process_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          process_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          process_type?: string
          user_id?: string
        }
        Relationships: []
      }
      money_lost_alerts: {
        Row: {
          alert_date: string
          cancel_rate: number
          cancellations_count: number
          created_at: string
          empty_slots_count: number
          estimated_loss: number
          id: string
          is_critical: boolean
          is_dismissed: boolean
          no_shows_count: number
          user_id: string
        }
        Insert: {
          alert_date?: string
          cancel_rate?: number
          cancellations_count?: number
          created_at?: string
          empty_slots_count?: number
          estimated_loss?: number
          id?: string
          is_critical?: boolean
          is_dismissed?: boolean
          no_shows_count?: number
          user_id: string
        }
        Update: {
          alert_date?: string
          cancel_rate?: number
          cancellations_count?: number
          created_at?: string
          empty_slots_count?: number
          estimated_loss?: number
          id?: string
          is_critical?: boolean
          is_dismissed?: boolean
          no_shows_count?: number
          user_id?: string
        }
        Relationships: []
      }
      monthly_revenue_history: {
        Row: {
          avg_ticket: number
          cancellation_count: number
          completed_appointments: number
          created_at: string
          id: string
          month_year: string
          new_clients: number
          no_show_count: number
          returning_clients: number
          total_revenue: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_ticket?: number
          cancellation_count?: number
          completed_appointments?: number
          created_at?: string
          id?: string
          month_year: string
          new_clients?: number
          no_show_count?: number
          returning_clients?: number
          total_revenue?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_ticket?: number
          cancellation_count?: number
          completed_appointments?: number
          created_at?: string
          id?: string
          month_year?: string
          new_clients?: number
          no_show_count?: number
          returning_clients?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      neighborhood_stats: {
        Row: {
          avg_latitude: number | null
          avg_longitude: number | null
          city: string | null
          clients_count: number | null
          id: string
          last_updated: string | null
          neighborhood: string
          total_revenue: number | null
          user_id: string
        }
        Insert: {
          avg_latitude?: number | null
          avg_longitude?: number | null
          city?: string | null
          clients_count?: number | null
          id?: string
          last_updated?: string | null
          neighborhood: string
          total_revenue?: number | null
          user_id: string
        }
        Update: {
          avg_latitude?: number | null
          avg_longitude?: number | null
          city?: string | null
          clients_count?: number | null
          id?: string
          last_updated?: string | null
          neighborhood?: string
          total_revenue?: number | null
          user_id?: string
        }
        Relationships: []
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
            foreignKeyName: "product_sales_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_public_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_barbershop_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "product_sales_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_services_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "product_sales_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_site_barbers_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "product_sales_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "barbershop_public_info"
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
          plan: string | null
          reminder_template: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
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
          plan?: string | null
          reminder_template?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
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
          plan?: string | null
          reminder_template?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
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
      reactivation_queue: {
        Row: {
          client_id: string
          client_name: string | null
          client_phone: string | null
          created_at: string
          days_inactive: number
          id: string
          last_appointment_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          days_inactive?: number
          id?: string
          last_appointment_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          days_inactive?: number
          id?: string
          last_appointment_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
      scheduled_triggers: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          priority: number
          start_date: string
          target_plans: string[]
          trigger_message: string
          trigger_name: string
          trigger_type: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          priority?: number
          start_date: string
          target_plans?: string[]
          trigger_message: string
          trigger_name: string
          trigger_type: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          priority?: number
          start_date?: string
          target_plans?: string[]
          trigger_message?: string
          trigger_name?: string
          trigger_type?: string
        }
        Relationships: []
      }
      sector_benchmarks: {
        Row: {
          avg_value: number
          created_at: string
          id: string
          last_calculated_at: string
          metric_name: string
          p25_value: number
          p50_value: number
          p75_value: number
          p90_value: number
          sample_size: number
          updated_at: string
        }
        Insert: {
          avg_value?: number
          created_at?: string
          id?: string
          last_calculated_at?: string
          metric_name: string
          p25_value?: number
          p50_value?: number
          p75_value?: number
          p90_value?: number
          sample_size?: number
          updated_at?: string
        }
        Update: {
          avg_value?: number
          created_at?: string
          id?: string
          last_calculated_at?: string
          metric_name?: string
          p25_value?: number
          p50_value?: number
          p75_value?: number
          p90_value?: number
          sample_size?: number
          updated_at?: string
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
      support_chat_messages: {
        Row: {
          classification: string | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          classification?: string | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          classification?: string | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      support_interaction_logs: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          agendamentos_30d: number | null
          ai_summary: string | null
          app_version: string | null
          assigned_to: string | null
          classification: string | null
          created_at: string
          device_id: string | null
          email: string
          faturamento_30d: number | null
          id: string
          mensagem: string
          nome: string
          plano: string
          priority_score: number | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          taxa_retorno: number | null
          tipo: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          agendamentos_30d?: number | null
          ai_summary?: string | null
          app_version?: string | null
          assigned_to?: string | null
          classification?: string | null
          created_at?: string
          device_id?: string | null
          email: string
          faturamento_30d?: number | null
          id?: string
          mensagem: string
          nome: string
          plano?: string
          priority_score?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          taxa_retorno?: number | null
          tipo: string
          user_id: string
          whatsapp: string
        }
        Update: {
          agendamentos_30d?: number | null
          ai_summary?: string | null
          app_version?: string | null
          assigned_to?: string | null
          classification?: string | null
          created_at?: string
          device_id?: string | null
          email?: string
          faturamento_30d?: number | null
          id?: string
          mensagem?: string
          nome?: string
          plano?: string
          priority_score?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          taxa_retorno?: number | null
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
      upgrade_trigger_events: {
        Row: {
          abandoned_bookings: number | null
          converted_at: string | null
          created_at: string
          dismissed_at: string | null
          id: string
          lost_clients: number | null
          lost_money: number | null
          manual_time_minutes: number | null
          no_show_count: number | null
          potential_revenue: number | null
          trigger_message: string | null
          trigger_type: string
          user_id: string
        }
        Insert: {
          abandoned_bookings?: number | null
          converted_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          lost_clients?: number | null
          lost_money?: number | null
          manual_time_minutes?: number | null
          no_show_count?: number | null
          potential_revenue?: number | null
          trigger_message?: string | null
          trigger_type: string
          user_id: string
        }
        Update: {
          abandoned_bookings?: number | null
          converted_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          lost_clients?: number | null
          lost_money?: number | null
          manual_time_minutes?: number | null
          no_show_count?: number | null
          potential_revenue?: number | null
          trigger_message?: string | null
          trigger_type?: string
          user_id?: string
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
      whatsapp_bot_config: {
        Row: {
          ai_personality: string | null
          auto_booking_enabled: boolean
          away_message: string | null
          business_days: number[] | null
          business_hours_end: string | null
          business_hours_start: string | null
          created_at: string
          custom_instructions: string | null
          greeting_message: string | null
          id: string
          is_enabled: boolean
          keywords_config: Json | null
          max_messages_before_transfer: number | null
          operating_hours_end: string | null
          operating_hours_start: string | null
          outside_hours_message: string | null
          response_delay_seconds: number | null
          transfer_keywords: string[] | null
          updated_at: string
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          ai_personality?: string | null
          auto_booking_enabled?: boolean
          away_message?: string | null
          business_days?: number[] | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          created_at?: string
          custom_instructions?: string | null
          greeting_message?: string | null
          id?: string
          is_enabled?: boolean
          keywords_config?: Json | null
          max_messages_before_transfer?: number | null
          operating_hours_end?: string | null
          operating_hours_start?: string | null
          outside_hours_message?: string | null
          response_delay_seconds?: number | null
          transfer_keywords?: string[] | null
          updated_at?: string
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          ai_personality?: string | null
          auto_booking_enabled?: boolean
          away_message?: string | null
          business_days?: number[] | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          created_at?: string
          custom_instructions?: string | null
          greeting_message?: string | null
          id?: string
          is_enabled?: boolean
          keywords_config?: Json | null
          max_messages_before_transfer?: number | null
          operating_hours_end?: string | null
          operating_hours_start?: string | null
          outside_hours_message?: string | null
          response_delay_seconds?: number | null
          transfer_keywords?: string[] | null
          updated_at?: string
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      whatsapp_bot_settings: {
        Row: {
          appointment_booking_enabled: boolean | null
          auto_reply_enabled: boolean | null
          away_message: string | null
          business_hours_enabled: boolean | null
          created_at: string
          id: string
          is_active: boolean | null
          keywords_config: Json | null
          keywords_enabled: boolean | null
          updated_at: string
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          appointment_booking_enabled?: boolean | null
          auto_reply_enabled?: boolean | null
          away_message?: string | null
          business_hours_enabled?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords_config?: Json | null
          keywords_enabled?: boolean | null
          updated_at?: string
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          appointment_booking_enabled?: boolean | null
          auto_reply_enabled?: boolean | null
          away_message?: string | null
          business_hours_enabled?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords_config?: Json | null
          keywords_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      whatsapp_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          is_from_bot: boolean
          media_mime_type: string | null
          media_url: string | null
          message_id: string | null
          message_type: string
          metadata: Json | null
          status: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          is_from_bot?: boolean
          media_mime_type?: string | null
          media_url?: string | null
          message_id?: string | null
          message_type?: string
          metadata?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          is_from_bot?: boolean
          media_mime_type?: string | null
          media_url?: string | null
          message_id?: string | null
          message_type?: string
          metadata?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          is_blocked: boolean | null
          last_message_at: string | null
          name: string | null
          notes: string | null
          phone: string
          profile_picture_url: string | null
          tags: string[] | null
          unread_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_blocked?: boolean | null
          last_message_at?: string | null
          name?: string | null
          notes?: string | null
          phone: string
          profile_picture_url?: string | null
          tags?: string[] | null
          unread_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_blocked?: boolean | null
          last_message_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string
          profile_picture_url?: string | null
          tags?: string[] | null
          unread_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "barbershop_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          lead_id: string | null
          phone: string
          status: string
          unread_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          phone: string
          status?: string
          unread_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          phone?: string
          status?: string
          unread_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_leads: {
        Row: {
          created_at: string
          id: string
          last_contact_at: string | null
          linked_profile_id: string | null
          name: string | null
          notes: string | null
          phone: string
          profile_picture_url: string | null
          status: string
          tags: string[] | null
          total_appointments: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_contact_at?: string | null
          linked_profile_id?: string | null
          name?: string | null
          notes?: string | null
          phone: string
          profile_picture_url?: string | null
          status?: string
          tags?: string[] | null
          total_appointments?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_contact_at?: string | null
          linked_profile_id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string
          profile_picture_url?: string | null
          status?: string
          tags?: string[] | null
          total_appointments?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_leads_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "barbershop_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_leads_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          appointment_id: string | null
          contact_name: string | null
          created_at: string
          direction: string
          id: string
          message: string
          message_type: string | null
          metadata: Json | null
          phone: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          contact_name?: string | null
          created_at?: string
          direction: string
          id?: string
          message: string
          message_type?: string | null
          metadata?: Json | null
          phone: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          contact_name?: string | null
          created_at?: string
          direction?: string
          id?: string
          message?: string
          message_type?: string | null
          metadata?: Json | null
          phone?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_public_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_metrics: {
        Row: {
          appointments_via_whatsapp: number
          avg_response_time_seconds: number | null
          conversations_resolved: number
          created_at: string
          date: string
          id: string
          new_leads: number
          total_conversations: number
          total_messages_received: number
          total_messages_sent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          appointments_via_whatsapp?: number
          avg_response_time_seconds?: number | null
          conversations_resolved?: number
          created_at?: string
          date: string
          id?: string
          new_leads?: number
          total_conversations?: number
          total_messages_received?: number
          total_messages_sent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          appointments_via_whatsapp?: number
          avg_response_time_seconds?: number | null
          conversations_resolved?: number
          created_at?: string
          date?: string
          id?: string
          new_leads?: number
          total_conversations?: number
          total_messages_received?: number
          total_messages_sent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_sessions: {
        Row: {
          created_at: string
          id: string
          last_connected_at: string | null
          phone_number: string | null
          qr_code: string | null
          session_data: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_connected_at?: string | null
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_connected_at?: string | null
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json | null
          status?: string
          updated_at?: string
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
      appointments_public_safe: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          barber_id: string | null
          barber_name: string | null
          duration_minutes: number | null
          id: string | null
          service_id: string | null
          service_name: string | null
          service_price: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_barbershop_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_services_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_site_barbers_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "barber_services_public"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "barber_site_services_public"
            referencedColumns: ["service_id"]
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
      barber_barbershop_public: {
        Row: {
          barber_id: string | null
          barbershop_logo_url: string | null
          barbershop_name: string | null
        }
        Relationships: []
      }
      barber_exceptions_public: {
        Row: {
          barber_id: string | null
          created_at: string | null
          date: string | null
          id: string | null
          is_closed: boolean | null
        }
        Insert: {
          barber_id?: string | null
          created_at?: string | null
          date?: string | null
          id?: string | null
          is_closed?: boolean | null
        }
        Update: {
          barber_id?: string | null
          created_at?: string | null
          date?: string | null
          id?: string | null
          is_closed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_exceptions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_barbershop_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_exceptions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_services_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_exceptions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barber_site_barbers_public"
            referencedColumns: ["barber_id"]
          },
          {
            foreignKeyName: "barber_exceptions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_exceptions_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_services_public: {
        Row: {
          barber_id: string | null
          duration_minutes: number | null
          price: number | null
          service_description: string | null
          service_id: string | null
          service_image_url: string | null
          service_name: string | null
        }
        Relationships: []
      }
      barber_site_barbers_public: {
        Row: {
          avatar_url: string | null
          barber_id: string | null
          barber_name: string | null
          barber_slug: string | null
          site_id: string | null
          site_slug: string | null
          specialty: string | null
        }
        Relationships: []
      }
      barber_site_services_public: {
        Row: {
          duration_minutes: number | null
          price: number | null
          service_description: string | null
          service_id: string | null
          service_image_url: string | null
          service_name: string | null
          site_id: string | null
          site_slug: string | null
        }
        Relationships: []
      }
      barber_site_stats_public: {
        Row: {
          completed_appointments: number | null
          site_id: string | null
          site_slug: string | null
        }
        Relationships: []
      }
      barber_sites_public: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          description: string | null
          id: string | null
          phone: string | null
          published: boolean | null
          seo_data: Json | null
          site_content: Json | null
          slug: string | null
          theme: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          phone?: string | null
          published?: boolean | null
          seo_data?: Json | null
          site_content?: Json | null
          slug?: string | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          phone?: string | null
          published?: boolean | null
          seo_data?: Json | null
          site_content?: Json | null
          slug?: string | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      barbers_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          slug: string | null
          specialty: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          slug?: string | null
          specialty?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          slug?: string | null
          specialty?: string | null
        }
        Relationships: []
      }
      barbershop_public_info: {
        Row: {
          activation_completed: boolean | null
          barbershop_logo_url: string | null
          barbershop_name: string | null
          created_at: string | null
          id: string | null
        }
        Insert: {
          activation_completed?: boolean | null
          barbershop_logo_url?: string | null
          barbershop_name?: string | null
          created_at?: string | null
          id?: string | null
        }
        Update: {
          activation_completed?: boolean | null
          barbershop_logo_url?: string | null
          barbershop_name?: string | null
          created_at?: string | null
          id?: string | null
        }
        Relationships: []
      }
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
      calculate_customer_score: {
        Args: {
          p_attended: number
          p_cancelled: number
          p_days_inactive: number
          p_months_as_client: number
          p_no_show: number
          p_rescheduled: number
        }
        Returns: number
      }
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
      create_appointment_safe:
        | {
            Args: {
              p_appointment_date: string
              p_appointment_time: string
              p_barber_id: string
              p_customer_name: string
              p_customer_phone: string
              p_notes?: string
              p_service_id: string
            }
            Returns: string
          }
        | {
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
      generate_site_slug: { Args: { site_title: string }; Returns: string }
      get_customer_status: { Args: { p_score: number }; Returns: string }
      get_or_create_whatsapp_conversation: {
        Args: { p_lead_id: string; p_phone: string; p_user_id: string }
        Returns: string
      }
      get_or_create_whatsapp_lead: {
        Args: { p_name?: string; p_phone: string; p_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_login_attempt: {
        Args: { p_email: string; p_ip_address?: string; p_success: boolean }
        Returns: undefined
      }
      submit_barbershop_lead: {
        Args: {
          p_name: string
          p_phone: string
          p_site_id: string
          p_source?: string
        }
        Returns: undefined
      }
      update_barber_goals_progress: { Args: never; Returns: undefined }
      update_sector_benchmarks: { Args: never; Returns: undefined }
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
