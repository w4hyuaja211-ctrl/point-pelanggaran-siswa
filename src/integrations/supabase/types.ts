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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      absensi: {
        Row: {
          created_at: string
          dicatat_oleh: string | null
          id: string
          kelas_id: string
          keterangan: string | null
          semester: Database["public"]["Enums"]["semester_type"] | null
          siswa_id: string
          status: Database["public"]["Enums"]["absensi_status"]
          tahun_ajaran_id: string | null
          tanggal: string
        }
        Insert: {
          created_at?: string
          dicatat_oleh?: string | null
          id?: string
          kelas_id: string
          keterangan?: string | null
          semester?: Database["public"]["Enums"]["semester_type"] | null
          siswa_id: string
          status?: Database["public"]["Enums"]["absensi_status"]
          tahun_ajaran_id?: string | null
          tanggal?: string
        }
        Update: {
          created_at?: string
          dicatat_oleh?: string | null
          id?: string
          kelas_id?: string
          keterangan?: string | null
          semester?: Database["public"]["Enums"]["semester_type"] | null
          siswa_id?: string
          status?: Database["public"]["Enums"]["absensi_status"]
          tahun_ajaran_id?: string | null
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "absensi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absensi_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absensi_tahun_ajaran_id_fkey"
            columns: ["tahun_ajaran_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      katalog_pelanggaran: {
        Row: {
          created_at: string
          id: string
          kategori: string
          nama: string
          poin: number
        }
        Insert: {
          created_at?: string
          id?: string
          kategori?: string
          nama: string
          poin?: number
        }
        Update: {
          created_at?: string
          id?: string
          kategori?: string
          nama?: string
          poin?: number
        }
        Relationships: []
      }
      kelas: {
        Row: {
          created_at: string
          id: string
          nama_kelas: string
          tingkat: string
          wali_kelas_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nama_kelas: string
          tingkat: string
          wali_kelas_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nama_kelas?: string
          tingkat?: string
          wali_kelas_id?: string | null
        }
        Relationships: []
      }
      pelanggaran: {
        Row: {
          created_at: string
          deskripsi: string | null
          dilaporkan_oleh: string | null
          id: string
          jenis: string
          katalog_id: string | null
          poin: number
          semester: Database["public"]["Enums"]["semester_type"] | null
          siswa_id: string
          tahun_ajaran_id: string | null
          tanggal: string
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          dilaporkan_oleh?: string | null
          id?: string
          jenis: string
          katalog_id?: string | null
          poin?: number
          semester?: Database["public"]["Enums"]["semester_type"] | null
          siswa_id: string
          tahun_ajaran_id?: string | null
          tanggal?: string
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          dilaporkan_oleh?: string | null
          id?: string
          jenis?: string
          katalog_id?: string | null
          poin?: number
          semester?: Database["public"]["Enums"]["semester_type"] | null
          siswa_id?: string
          tahun_ajaran_id?: string | null
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "pelanggaran_katalog_id_fkey"
            columns: ["katalog_id"]
            isOneToOne: false
            referencedRelation: "katalog_pelanggaran"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pelanggaran_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pelanggaran_tahun_ajaran_id_fkey"
            columns: ["tahun_ajaran_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      pengaturan_sekolah: {
        Row: {
          alamat: string | null
          id: string
          kepala_sekolah: string
          logo_url: string | null
          nama_sekolah: string
          nip_kepala: string | null
          updated_at: string
        }
        Insert: {
          alamat?: string | null
          id?: string
          kepala_sekolah?: string
          logo_url?: string | null
          nama_sekolah?: string
          nip_kepala?: string | null
          updated_at?: string
        }
        Update: {
          alamat?: string | null
          id?: string
          kepala_sekolah?: string
          logo_url?: string | null
          nama_sekolah?: string
          nip_kepala?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          login_code: string | null
          nama_lengkap: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          login_code?: string | null
          nama_lengkap?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          login_code?: string | null
          nama_lengkap?: string
          updated_at?: string
        }
        Relationships: []
      }
      siswa: {
        Row: {
          created_at: string
          id: string
          jenis_kelamin: Database["public"]["Enums"]["jenis_kelamin_type"]
          kelas_id: string | null
          nama: string
          nis: string | null
          nisn: string | null
          total_poin: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          jenis_kelamin?: Database["public"]["Enums"]["jenis_kelamin_type"]
          kelas_id?: string | null
          nama: string
          nis?: string | null
          nisn?: string | null
          total_poin?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          jenis_kelamin?: Database["public"]["Enums"]["jenis_kelamin_type"]
          kelas_id?: string | null
          nama?: string
          nis?: string | null
          nisn?: string | null
          total_poin?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "siswa_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
        ]
      }
      tahun_ajaran: {
        Row: {
          created_at: string
          id: string
          is_aktif: boolean
          nama: string
          semester: Database["public"]["Enums"]["semester_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_aktif?: boolean
          nama: string
          semester: Database["public"]["Enums"]["semester_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_aktif?: boolean
          nama?: string
          semester?: Database["public"]["Enums"]["semester_type"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      absensi_status: "hadir" | "sakit" | "izin" | "alpa"
      app_role: "admin" | "guru_piket" | "wali_kelas" | "siswa"
      jenis_kelamin_type: "L" | "P"
      semester_type: "ganjil" | "genap"
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
      absensi_status: ["hadir", "sakit", "izin", "alpa"],
      app_role: ["admin", "guru_piket", "wali_kelas", "siswa"],
      jenis_kelamin_type: ["L", "P"],
      semester_type: ["ganjil", "genap"],
    },
  },
} as const
