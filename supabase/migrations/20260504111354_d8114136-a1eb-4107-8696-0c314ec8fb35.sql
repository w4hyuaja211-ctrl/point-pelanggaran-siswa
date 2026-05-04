
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'guru_piket', 'wali_kelas', 'siswa');
CREATE TYPE public.semester_type AS ENUM ('ganjil', 'genap');
CREATE TYPE public.jenis_kelamin_type AS ENUM ('L', 'P');
CREATE TYPE public.absensi_status AS ENUM ('hadir', 'sakit', 'izin', 'alpa');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL DEFAULT '',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ PENGATURAN SEKOLAH ============
CREATE TABLE public.pengaturan_sekolah (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_sekolah TEXT NOT NULL DEFAULT 'Nama Sekolah',
  kepala_sekolah TEXT NOT NULL DEFAULT '',
  nip_kepala TEXT DEFAULT '',
  alamat TEXT DEFAULT '',
  logo_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pengaturan_sekolah ENABLE ROW LEVEL SECURITY;
INSERT INTO public.pengaturan_sekolah (nama_sekolah, kepala_sekolah) VALUES ('Nama Sekolah', '');

-- ============ TAHUN AJARAN ============
CREATE TABLE public.tahun_ajaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  semester semester_type NOT NULL,
  is_aktif BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(nama, semester)
);
ALTER TABLE public.tahun_ajaran ENABLE ROW LEVEL SECURITY;

-- Function to ensure only one active tahun_ajaran
CREATE OR REPLACE FUNCTION public.ensure_single_active_tahun_ajaran()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_aktif = true THEN
    UPDATE public.tahun_ajaran SET is_aktif = false WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_single_active_tahun_ajaran
  BEFORE INSERT OR UPDATE ON public.tahun_ajaran
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_active_tahun_ajaran();

-- ============ KELAS ============
CREATE TABLE public.kelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kelas TEXT NOT NULL,
  tingkat TEXT NOT NULL,
  wali_kelas_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;

-- ============ SISWA ============
CREATE TABLE public.siswa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nisn TEXT,
  nis TEXT,
  nama TEXT NOT NULL,
  jenis_kelamin jenis_kelamin_type NOT NULL DEFAULT 'L',
  kelas_id UUID REFERENCES public.kelas(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_poin INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;

-- ============ KATALOG PELANGGARAN ============
CREATE TABLE public.katalog_pelanggaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'Umum',
  poin INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.katalog_pelanggaran ENABLE ROW LEVEL SECURITY;

-- ============ PELANGGARAN (record) ============
CREATE TABLE public.pelanggaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  katalog_id UUID REFERENCES public.katalog_pelanggaran(id) ON DELETE SET NULL,
  jenis TEXT NOT NULL,
  poin INTEGER NOT NULL DEFAULT 0,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  deskripsi TEXT,
  dilaporkan_oleh UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tahun_ajaran_id UUID REFERENCES public.tahun_ajaran(id) ON DELETE SET NULL,
  semester semester_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pelanggaran ENABLE ROW LEVEL SECURITY;

-- Trigger to update siswa.total_poin
CREATE OR REPLACE FUNCTION public.update_total_poin_siswa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.siswa SET total_poin = total_poin + NEW.poin WHERE id = NEW.siswa_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.siswa SET total_poin = GREATEST(0, total_poin - OLD.poin) WHERE id = OLD.siswa_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.siswa SET total_poin = GREATEST(0, total_poin - OLD.poin + NEW.poin) WHERE id = NEW.siswa_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER trg_update_total_poin
  AFTER INSERT OR UPDATE OR DELETE ON public.pelanggaran
  FOR EACH ROW EXECUTE FUNCTION public.update_total_poin_siswa();

-- ============ ABSENSI ============
CREATE TABLE public.absensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  status absensi_status NOT NULL DEFAULT 'hadir',
  keterangan TEXT,
  dicatat_oleh UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tahun_ajaran_id UUID REFERENCES public.tahun_ajaran(id) ON DELETE SET NULL,
  semester semester_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tanggal, siswa_id)
);
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;

-- ============ HANDLE NEW USER (auto-create profile) ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama_lengkap, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', NEW.email),
    NEW.email
  );
  -- default role siswa supaya tidak tanpa role; admin bisa ubah
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'siswa')
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Guru piket dan wali can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'guru_piket') OR public.has_role(auth.uid(), 'wali_kelas')
  );
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- pengaturan_sekolah (semua authenticated bisa baca, hanya admin bisa update)
CREATE POLICY "All authenticated can view sekolah" ON public.pengaturan_sekolah
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update sekolah" ON public.pengaturan_sekolah
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert sekolah" ON public.pengaturan_sekolah
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- tahun_ajaran (semua authenticated bisa baca, admin kelola)
CREATE POLICY "All authenticated can view tahun ajaran" ON public.tahun_ajaran
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage tahun ajaran" ON public.tahun_ajaran
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- kelas
CREATE POLICY "All authenticated can view kelas" ON public.kelas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage kelas" ON public.kelas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- siswa
CREATE POLICY "Admin guru piket lihat semua siswa" ON public.siswa
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru_piket')
  );
CREATE POLICY "Wali kelas lihat siswa kelasnya" ON public.siswa
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'wali_kelas')
    AND kelas_id IN (SELECT id FROM public.kelas WHERE wali_kelas_id = auth.uid())
  );
CREATE POLICY "Siswa lihat data sendiri" ON public.siswa
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin manage siswa" ON public.siswa
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- katalog_pelanggaran
CREATE POLICY "All authenticated view katalog" ON public.katalog_pelanggaran
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage katalog" ON public.katalog_pelanggaran
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- pelanggaran
CREATE POLICY "Admin guru piket lihat semua pelanggaran" ON public.pelanggaran
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru_piket')
  );
CREATE POLICY "Wali kelas lihat pelanggaran kelasnya" ON public.pelanggaran
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'wali_kelas')
    AND siswa_id IN (
      SELECT s.id FROM public.siswa s
      JOIN public.kelas k ON k.id = s.kelas_id
      WHERE k.wali_kelas_id = auth.uid()
    )
  );
CREATE POLICY "Siswa lihat pelanggaran sendiri" ON public.pelanggaran
  FOR SELECT TO authenticated USING (
    siswa_id IN (SELECT id FROM public.siswa WHERE user_id = auth.uid())
  );
CREATE POLICY "Guru piket admin insert pelanggaran" ON public.pelanggaran
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru_piket')
  );
CREATE POLICY "Guru piket admin update pelanggaran" ON public.pelanggaran
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru_piket')
  );
CREATE POLICY "Guru piket admin delete pelanggaran" ON public.pelanggaran
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru_piket')
  );

-- absensi
CREATE POLICY "Admin guru piket lihat semua absensi" ON public.absensi
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru_piket')
  );
CREATE POLICY "Wali kelas lihat absensi kelasnya" ON public.absensi
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'wali_kelas')
    AND kelas_id IN (SELECT id FROM public.kelas WHERE wali_kelas_id = auth.uid())
  );
CREATE POLICY "Siswa lihat absensi sendiri" ON public.absensi
  FOR SELECT TO authenticated USING (
    siswa_id IN (SELECT id FROM public.siswa WHERE user_id = auth.uid())
  );
CREATE POLICY "Guru piket admin manage absensi" ON public.absensi
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru_piket'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'guru_piket'));

-- Seed beberapa katalog pelanggaran umum
INSERT INTO public.katalog_pelanggaran (nama, kategori, poin) VALUES
  ('Terlambat masuk sekolah', 'Kedisiplinan', 5),
  ('Tidak memakai seragam lengkap', 'Kedisiplinan', 10),
  ('Bolos jam pelajaran', 'Kedisiplinan', 25),
  ('Merokok di lingkungan sekolah', 'Berat', 75),
  ('Berkelahi', 'Berat', 100),
  ('Tidak mengerjakan PR', 'Akademik', 5),
  ('Membawa HP saat pelajaran', 'Kedisiplinan', 15);
