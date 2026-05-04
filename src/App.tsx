import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import AppLayout from "./components/AppLayout";
import { RequireAuth, RequireRole } from "./components/RoleGuard";
import { AuthProvider } from "./hooks/useAuth";
import InputPelanggaran from "./pages/InputPelanggaran";
import InputAbsensi from "./pages/InputAbsensi";
import DataSiswa from "./pages/DataSiswa";
import KelasSaya from "./pages/KelasSaya";
import CatatanSaya from "./pages/CatatanSaya";
import PengaturanSekolah from "./pages/admin/PengaturanSekolah";
import TahunAjaran from "./pages/admin/TahunAjaran";
import KelasAdmin from "./pages/admin/Kelas";
import SiswaAdmin from "./pages/admin/SiswaAdmin";
import KatalogPelanggaran from "./pages/admin/KatalogPelanggaran";
import UsersAdmin from "./pages/admin/UsersAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route path="/" element={<Index />} />
              <Route path="/pelanggaran" element={<RequireRole roles={["admin","guru_piket"]}><InputPelanggaran /></RequireRole>} />
              <Route path="/absensi" element={<RequireRole roles={["admin","guru_piket"]}><InputAbsensi /></RequireRole>} />
              <Route path="/siswa" element={<RequireRole roles={["admin","guru_piket","wali_kelas"]}><DataSiswa /></RequireRole>} />
              <Route path="/kelas-saya" element={<RequireRole roles={["wali_kelas"]}><KelasSaya /></RequireRole>} />
              <Route path="/saya" element={<RequireRole roles={["siswa"]}><CatatanSaya /></RequireRole>} />
              <Route path="/admin/sekolah" element={<RequireRole roles={["admin"]}><PengaturanSekolah /></RequireRole>} />
              <Route path="/admin/tahun-ajaran" element={<RequireRole roles={["admin"]}><TahunAjaran /></RequireRole>} />
              <Route path="/admin/kelas" element={<RequireRole roles={["admin"]}><KelasAdmin /></RequireRole>} />
              <Route path="/admin/siswa" element={<RequireRole roles={["admin"]}><SiswaAdmin /></RequireRole>} />
              <Route path="/admin/katalog" element={<RequireRole roles={["admin"]}><KatalogPelanggaran /></RequireRole>} />
              <Route path="/admin/users" element={<RequireRole roles={["admin"]}><UsersAdmin /></RequireRole>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
