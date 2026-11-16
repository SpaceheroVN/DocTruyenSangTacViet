<# :
@echo off
chcp 65001 >nul
cls
title Kích Hoạt Web Speech API
cd /d "%~dp0"

:: Chuyen huong chay vao Windows Terminal (neu co va chua nam trong WT)
if not defined WT_SESSION if not defined KHONG_CHAY_LAI if /i not "%TERM_PROGRAM%"=="vscode" (
    where wt.exe >nul 2>&1
    if not errorlevel 1 (
        set "KHONG_CHAY_LAI=1"
        powershell -WindowStyle Hidden -NoProfile -Command "Start-Process wt.exe -ArgumentList 'cmd.exe /c \"%~f0\" %*'"
        exit /b
    )
)

set "duong_dan_tep_lenh=%~f0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$global:duong_dan_tep_lenh=$env:duong_dan_tep_lenh; $global:tham_so_dau_vao='%~1'; try { [Console]::OutputEncoding=[System.Text.Encoding]::UTF8 } catch {}; try { [Console]::CursorVisible=$false } catch {}; try { $ma_nguon = [System.IO.File]::ReadAllText($env:duong_dan_tep_lenh, [System.Text.Encoding]::UTF8); & {[ScriptBlock]::Create($ma_nguon).Invoke()} } catch { Write-Host \`"`n[LOI] $_ \`" -ForegroundColor Red; Write-Host $_.ScriptStackTrace -ForegroundColor Yellow; Start-Sleep -Seconds 3 }"
exit /b
#>

# Khoi tao Win32 va dieu khien cua so
$ma_nguon_win32 = @"
using System;
using System.Runtime.InteropServices;

public class DieuKhienChuot {
    public const int STD_INPUT_HANDLE = -10;
    public const int STD_OUTPUT_HANDLE = -11;
    public const int ENABLE_MOUSE_INPUT = 0x0010;
    public const int ENABLE_EXTENDED_FLAGS = 0x0080;
    public const int ENABLE_QUICK_EDIT_MODE = 0x0040;
    public const int ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;

    public const int SM_CXSCREEN = 0;
    public const int SM_CYSCREEN = 1;
    public const uint SWP_NOZORDER = 0x0004;
    public const uint SWP_FRAMECHANGED = 0x0020;
    public const uint GW_OWNER = 4;
    public const int GWL_STYLE = -16;
    public const int WS_THICKFRAME = 0x00040000;
    public const int WS_MAXIMIZEBOX = 0x00010000;

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool SetConsoleOutputCP(uint wCodePageID);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool SetConsoleCP(uint wCodePageID);

    [StructLayout(LayoutKind.Sequential)]
    public struct COORD {
        public short X;
        public short Y;
    }

    [StructLayout(LayoutKind.Explicit)]
    public struct MOUSE_EVENT_RECORD {
        [FieldOffset(0)] public COORD dwMousePosition;
        [FieldOffset(4)] public int dwButtonState;
        [FieldOffset(8)] public int dwControlKeyState;
        [FieldOffset(12)] public int dwEventFlags;
    }

    [StructLayout(LayoutKind.Explicit)]
    public struct KEY_EVENT_RECORD {
        [FieldOffset(0)] public int bKeyDown;
        [FieldOffset(4)] public ushort wRepeatCount;
        [FieldOffset(6)] public ushort wVirtualKeyCode;
        [FieldOffset(8)] public ushort wVirtualScanCode;
        [FieldOffset(10)] public char UnicodeChar;
        [FieldOffset(12)] public int dwControlKeyState;
    }

    [StructLayout(LayoutKind.Explicit)]
    public struct INPUT_RECORD {
        [FieldOffset(0)] public ushort EventType;
        [FieldOffset(4)] public KEY_EVENT_RECORD KeyEvent;
        [FieldOffset(4)] public MOUSE_EVENT_RECORD MouseEvent;
    }

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr GetStdHandle(int nStdHandle);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool GetConsoleMode(IntPtr hConsoleInput, out int lpMode);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool SetConsoleMode(IntPtr hConsoleInput, int dwMode);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool ReadConsoleInput(IntPtr hConsoleInput, [Out] INPUT_RECORD[] lpBuffer, uint nLength, out uint lpNumberOfEventsRead);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool GetNumberOfConsoleInputEvents(IntPtr hConsoleInput, out uint lpcNumberOfEvents);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool FlushConsoleInputBuffer(IntPtr hConsoleInput);

    [DllImport("kernel32.dll")]
    public static extern IntPtr GetConsoleWindow();

    [DllImport("user32.dll")]
    public static extern IntPtr GetParent(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr GetAncestor(IntPtr hwnd, uint flags);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll")]
    public static extern int GetSystemMetrics(int nIndex);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

    public static void KichHoatVT() {
        try {
            SetConsoleOutputCP(65001);
            SetConsoleCP(65001);

            IntPtr tay_cam_nhap = GetStdHandle(STD_INPUT_HANDLE);
            int che_do_nhap;
            GetConsoleMode(tay_cam_nhap, out che_do_nhap);
            che_do_nhap &= ~ENABLE_QUICK_EDIT_MODE;
            che_do_nhap |= ENABLE_MOUSE_INPUT | ENABLE_EXTENDED_FLAGS;
            SetConsoleMode(tay_cam_nhap, che_do_nhap);

            IntPtr tay_cam_xuat = GetStdHandle(STD_OUTPUT_HANDLE);
            int che_do_xuat;
            GetConsoleMode(tay_cam_xuat, out che_do_xuat);
            che_do_xuat |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
            SetConsoleMode(tay_cam_xuat, che_do_xuat);
        } catch {}
    }

    public static void DatKichThuocVaKhoa(int rong = 736, int cao = 495) {
        try {
            IntPtr hWnd = GetConsoleWindow();
            if (hWnd == IntPtr.Zero) return;

            IntPtr cua_so_muc_tieu = GetAncestor(hWnd, 2);
            if (cua_so_muc_tieu == IntPtr.Zero || cua_so_muc_tieu == hWnd) {
                cua_so_muc_tieu = GetWindow(hWnd, GW_OWNER);
            }
            if (cua_so_muc_tieu == IntPtr.Zero) {
                IntPtr cua_so_cha = GetParent(hWnd);
                cua_so_muc_tieu = (cua_so_cha != IntPtr.Zero) ? cua_so_cha : hWnd;
            }
            if (cua_so_muc_tieu == IntPtr.Zero) cua_so_muc_tieu = hWnd;

            int chieu_rong_man_hinh = GetSystemMetrics(SM_CXSCREEN);
            int chieu_cao_man_hinh = GetSystemMetrics(SM_CYSCREEN);

            int vi_tri_x = Math.Max(0, (chieu_rong_man_hinh - rong) / 2);
            int vi_tri_y = Math.Max(0, (chieu_cao_man_hinh - cao) / 2);

            SetWindowPos(cua_so_muc_tieu, IntPtr.Zero, vi_tri_x, vi_tri_y, rong, cao, SWP_NOZORDER);

            int kieu_dang = GetWindowLong(cua_so_muc_tieu, GWL_STYLE);
            kieu_dang &= ~WS_THICKFRAME;
            kieu_dang &= ~WS_MAXIMIZEBOX;
            SetWindowLong(cua_so_muc_tieu, GWL_STYLE, kieu_dang);

            SetWindowPos(cua_so_muc_tieu, IntPtr.Zero, vi_tri_x, vi_tri_y, rong, cao, SWP_NOZORDER | SWP_FRAMECHANGED);
        } catch {}
    }
}
"@

if (-not (([System.Management.Automation.PSTypeName]'DieuKhienChuot').Type)) {
    Add-Type -TypeDefinition $ma_nguon_win32 -ErrorAction SilentlyContinue
}
try {
    [DieuKhienChuot]::KichHoatVT()
    [DieuKhienChuot]::DatKichThuocVaKhoa(736, 495)
} catch {}
try { [Console]::CursorVisible = $false } catch {}
try { $Host.UI.RawUI.WindowTitle = "Kích Hoạt Web Speech API" } catch {}

# Kiem tra co che doc ban
$script:ten_mutex = "Global\Kich_Hoat_Web_Speech_API"
$script:tao_moi = $false
for ($lan = 0; $lan -lt 5; $lan++) {
    try {
        $script:mutex_ung_dung = New-Object System.Threading.Mutex($true, $script:ten_mutex, [ref]$script:tao_moi)
        if ($script:tao_moi) { break }
        if ($script:mutex_ung_dung) {
            try { $script:mutex_ung_dung.Dispose() } catch {}
            $script:mutex_ung_dung = $null
        }
    } catch {}
    Start-Sleep -Milliseconds 150
}

if (-not $script:tao_moi) {
    try {
        Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue
        [System.Windows.Forms.MessageBox]::Show("Ứng dụng đang chạy trên hệ thống.`nVui lòng kiểm tra thanh tác vụ hoặc đóng cửa sổ cũ trước khi mở phiên mới.", "Kích Hoạt Web Speech API", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
    } catch {
        Write-Host "`n[!] Ung dung dang chay tren he thong. Vui long dong phien cu." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
    [System.Environment]::Exit(0)
}

# Thiet lap bo dem khong cuon
try {
    $giao_dien_goc = $Host.UI.RawUI
    $chieu_ngang = [math]::Max(76, $giao_dien_goc.WindowSize.Width)
    $chieu_cao = [math]::Max(22, $giao_dien_goc.WindowSize.Height)
    $giao_dien_goc.BufferSize = New-Object System.Management.Automation.Host.Size($chieu_ngang, $chieu_cao)
} catch {}

# Bang ma mau ANSI
$ky_tu_esc = [char]27
$mau_khoi_tao = "$ky_tu_esc[0m"
$mau_xanh_duong = "$ky_tu_esc[38;2;40;210;240m"
$mau_xanh_nhat = "$ky_tu_esc[38;2;150;235;255m"
$mau_xanh_la = "$ky_tu_esc[38;2;80;220;120m"
$mau_xanh_la_sang = "$ky_tu_esc[38;2;120;240;130m"
$mau_vang = "$ky_tu_esc[38;2;255;200;60m"
$mau_vang_nhat = "$ky_tu_esc[38;2;255;235;120m"
$mau_do = "$ky_tu_esc[38;2;245;80;80m"
$mau_trang = "$ky_tu_esc[38;2;224;224;230m"
$mau_xam = "$ky_tu_esc[38;2;140;140;155m"
$mau_toi = "$ky_tu_esc[38;2;75;75;90m"

$nen_re_chuot_xanh = "$ky_tu_esc[48;2;30;145;65m$ky_tu_esc[38;2;255;255;255m"
$nen_re_chuot_do = "$ky_tu_esc[48;2;180;35;35m$ky_tu_esc[38;2;255;255;255m"
$nen_nhan_chuot_xanh = "$ky_tu_esc[48;2;60;190;95m$ky_tu_esc[38;2;255;255;255m"
$nen_nhan_chuot_do = "$ky_tu_esc[48;2;225;55;55m$ky_tu_esc[38;2;255;255;255m"

# Ham dat vi tri con tro
function dat_vi_tri_con_tro($cot, $hang) {
    try { [Console]::SetCursorPosition([int]$cot, [int]$hang) } catch {}
}

# Ham in dong khung do rong 74 ky tu
function in_dong_khung($noi_dung_mau, $chuoi_tho) {
    $do_dai = $chuoi_tho.Length
    $khoang_trang_thieu = [math]::Max(0, 70 - $do_dai)
    $dem_khoang_trang = " " * $khoang_trang_thieu
    Write-Host "$mau_toi│$mau_khoi_tao $noi_dung_mau$dem_khoang_trang $mau_toi│$mau_khoi_tao"
}

# Kiem tra quyen quan tri
$co_quyen_quan_tri = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$la_tien_trinh_nang_quyen = ($global:tham_so_dau_vao -eq "elevated" -or $co_quyen_quan_tri)

# Giao dien chinh
function ve_giao_dien_chinh() {
    [Console]::Clear()
    dat_vi_tri_con_tro 0 0
    Write-Host "$mau_toi╭────────────────────────────────────────────────────────────────────────╮$mau_khoi_tao"
    in_dong_khung "$mau_xanh_duong    KÍCH HOẠT & THIẾT LẬP 3 GÓI GIỌNG TIẾNG VIỆT (WEB SPEECH API)    $mau_khoi_tao" "    KÍCH HOẠT & THIẾT LẬP 3 GÓI GIỌNG TIẾNG VIỆT (WEB SPEECH API)    "
    Write-Host "$mau_toi├────────────────────────────────────────────────────────────────────────┤$mau_khoi_tao"
    in_dong_khung "$mau_vang[!] LƯU Ý QUAN TRỌNG VỀ CÁC GÓI GIỌNG NÓI TRƯỚC KHI TIẾN HÀNH:$mau_khoi_tao" "[!] LƯU Ý QUAN TRỌNG VỀ CÁC GÓI GIỌNG NÓI TRƯỚC KHI TIẾN HÀNH:"
    in_dong_khung "$mau_xanh_nhat 1. VỀ 2 GIỌNG ONLINE AI CAO CẤP:$mau_khoi_tao" " 1. VỀ 2 GIỌNG ONLINE AI CAO CẤP:"
    in_dong_khung "    - $mau_trang`"Microsoft Hoài My`"$mau_khoi_tao $mau_xanh_la(Nữ)$mau_khoi_tao" "    - `"Microsoft Hoài My`" (Nữ)"
    in_dong_khung "    - $mau_trang`"Microsoft Nam Minh`"$mau_khoi_tao $mau_xanh_duong(Nam)$mau_khoi_tao" "    - `"Microsoft Nam Minh`" (Nam)"
    in_dong_khung "    * $mau_vang QUAN TRỌNG: 2 giọng này CHỈ CÓ TRÊN MICROSOFT EDGE.$mau_khoi_tao" "    * QUAN TRỌNG: 2 giọng này CHỈ CÓ TRÊN MICROSOFT EDGE."
    in_dong_khung "      (Các trình duyệt khác KHÔNG hỗ trợ 2 giọng này)." "      (Các trình duyệt khác KHÔNG hỗ trợ 2 giọng này)."
    in_dong_khung "    * $mau_do CÓ THỂ BỊ VÔ HIỆU HÓA HOẶC THAY ĐỔI TRONG TƯƠNG LAI$mau_khoi_tao" "    * CÓ THỂ BỊ VÔ HIỆU HÓA HOẶC THAY ĐỔI TRONG TƯƠNG LAI"
    in_dong_khung "      $mau_vang(điều này HOÀN TOÀN PHỤ THUỘC VÀO CHÍNH SÁCH CỦA EDGE).$mau_khoi_tao" "      (điều này HOÀN TOÀN PHỤ THUỘC VÀO CHÍNH SÁCH CỦA EDGE)."
    in_dong_khung "$mau_xanh_la 2. VỀ GIỌNG OFFLINE CỤC BỘ CỦA WINDOWS:$mau_khoi_tao" " 2. VỀ GIỌNG OFFLINE CỤC BỘ CỦA WINDOWS:"
    in_dong_khung "    - $mau_trang`"Microsoft An`"$mau_khoi_tao (hoặc Microsoft An Desktop) $mau_xanh_duong(Nam)$mau_khoi_tao" "    - `"Microsoft An`" (hoặc Microsoft An Desktop) (Nam)"
    in_dong_khung "    * Cài trực tiếp vào máy tính, vĩnh viễn không cần mạng và" "    * Cài trực tiếp vào máy tính, vĩnh viễn không cần mạng và"
    in_dong_khung "      hỗ trợ $mau_xanh_la_sang các trình duyệt web$mau_khoi_tao trên máy tính." "      hỗ trợ các trình duyệt web trên máy tính."
    in_dong_khung "" ""
    in_dong_khung "$mau_trang Bạn có muốn tiến hành kích hoạt và thiết lập ngay bây giờ không?$mau_khoi_tao" " Bạn có muốn tiến hành kích hoạt và thiết lập ngay bây giờ không?"
    in_dong_khung "" ""
    ve_hai_nut 0
    in_dong_khung "" ""
    Write-Host "$mau_toi╰────────────────────────────────────────────────────────────────────────╯$mau_khoi_tao" -NoNewline
}

# Ve hai nut thao tac
function ve_hai_nut($trang_thai_re_chuot, $dang_nhan_chuot = $false) {
    dat_vi_tri_con_tro 0 18
    $chuoi_nut_cai_dat = if ($trang_thai_re_chuot -eq 1) {
        if ($dang_nhan_chuot) { "$nen_nhan_chuot_xanh[  Cài Đặt Ngay  ]$mau_khoi_tao" }
        else { "$nen_re_chuot_xanh[  Cài Đặt Ngay  ]$mau_khoi_tao" }
    } else {
        "$mau_xanh_la[  Cài Đặt Ngay  ]$mau_khoi_tao"
    }

    $chuoi_nut_huy_bo = if ($trang_thai_re_chuot -eq 2) {
        if ($dang_nhan_chuot) { "$nen_nhan_chuot_do[ Hủy Bỏ & Thoát ]$mau_khoi_tao" }
        else { "$nen_re_chuot_do[ Hủy Bỏ & Thoát ]$mau_khoi_tao" }
    } else {
        "$mau_do[ Hủy Bỏ & Thoát ]$mau_khoi_tao"
    }

    $dong_mau = "            $chuoi_nut_cai_dat          $chuoi_nut_huy_bo            "
    $dong_tho = "            [  Cài Đặt Ngay  ]          [ Hủy Bỏ & Thoát ]            "
    in_dong_khung $dong_mau $dong_tho
}

# Xu ly thao tac nguoi dung
function cho_thao_tac_nguoi_dung() {
    $tay_cam_dau_vao = [DieuKhienChuot]::GetStdHandle([DieuKhienChuot]::STD_INPUT_HANDLE)
    try { [DieuKhienChuot]::FlushConsoleInputBuffer($tay_cam_dau_vao) | Out-Null } catch {}
    $danh_sach_ban_ghi = New-Object DieuKhienChuot+INPUT_RECORD[] 64

    $trang_thai_re_chuot_truoc = 0
    $da_nhan_chuot_truoc = $false

    while ($true) {
        Start-Sleep -Milliseconds 25
        [uint32]$so_luong_su_kien = 0
        [DieuKhienChuot]::GetNumberOfConsoleInputEvents($tay_cam_dau_vao, [ref]$so_luong_su_kien) | Out-Null
        if ($so_luong_su_kien -le 0) { continue }

        [uint32]$so_luong_can_doc = [math]::Min([uint32]$danh_sach_ban_ghi.Length, $so_luong_su_kien)
        [uint32]$so_luong_da_doc = 0
        [DieuKhienChuot]::ReadConsoleInput($tay_cam_dau_vao, $danh_sach_ban_ghi, $so_luong_can_doc, [ref]$so_luong_da_doc) | Out-Null

        for ($chi_so = 0; $chi_so -lt $so_luong_da_doc; $chi_so++) {
            $ban_ghi = $danh_sach_ban_ghi[$chi_so]

            # Xu ly ban phim
            if ($ban_ghi.EventType -eq 1 -and $ban_ghi.KeyEvent.bKeyDown -ne 0) {
                $ma_phim = $ban_ghi.KeyEvent.wVirtualKeyCode

                # Bo qua phim bo tro: Shift, Ctrl, Alt, Win, CapsLock, Tab
                if ($ma_phim -in @(0x10, 0x11, 0x12, 0x5B, 0x5C, 0x14, 0x09)) {
                    continue
                }

                $ky_tu_phim = $ban_ghi.KeyEvent.UnicodeChar.ToString().ToUpper()

                if ($ma_phim -eq 0x0D -or $ma_phim -eq 0x20 -or $ky_tu_phim -eq 'Y' -or $ky_tu_phim -eq 'C') {
                    ve_hai_nut 1 $true
                    Start-Sleep -Milliseconds 120
                    return 'cai_dat'
                }
                if ($ma_phim -eq 0x1B -or $ky_tu_phim -eq 'N' -or $ky_tu_phim -eq 'K') {
                    ve_hai_nut 2 $true
                    Start-Sleep -Milliseconds 120
                    return 'huy_bo'
                }
            }

            # Xu ly chuot
            if ($ban_ghi.EventType -eq 2) {
                $su_kien_chuot = $ban_ghi.MouseEvent
                $toa_do_x = $su_kien_chuot.dwMousePosition.X
                $toa_do_y = $su_kien_chuot.dwMousePosition.Y
                $dang_nhan_chuot_trai = ($su_kien_chuot.dwButtonState -band 1) -ne 0

                $trang_thai_re_chuot_hien_tai = 0
                if ($toa_do_y -eq 18) {
                    if ($toa_do_x -ge 14 -and $toa_do_x -le 31) {
                        $trang_thai_re_chuot_hien_tai = 1
                    } elseif ($toa_do_x -ge 42 -and $toa_do_x -le 59) {
                        $trang_thai_re_chuot_hien_tai = 2
                    }
                }

                if ($trang_thai_re_chuot_hien_tai -ne $trang_thai_re_chuot_truoc) {
                    $trang_thai_re_chuot_truoc = $trang_thai_re_chuot_hien_tai
                    ve_hai_nut $trang_thai_re_chuot_hien_tai
                }

                if ($dang_nhan_chuot_trai -and -not $da_nhan_chuot_truoc) {
                    if ($trang_thai_re_chuot_hien_tai -eq 1) {
                        ve_hai_nut 1 $true
                        Start-Sleep -Milliseconds 120
                        return 'cai_dat'
                    } elseif ($trang_thai_re_chuot_hien_tai -eq 2) {
                        ve_hai_nut 2 $true
                        Start-Sleep -Milliseconds 120
                        return 'huy_bo'
                    }
                }
                $da_nhan_chuot_truoc = $dang_nhan_chuot_trai
            }
        }
    }
}

# Tien hanh cai dat va mo khoa
function tien_hanh_cai_dat() {
    if (-not $co_quyen_quan_tri) {
        dat_vi_tri_con_tro 0 16
        in_dong_khung "$mau_vang[*] Đang yêu cầu quyền Administrator để cài đặt...$mau_khoi_tao" "[*] Đang yêu cầu quyền Administrator để cài đặt..."
        dat_vi_tri_con_tro 0 18
        in_dong_khung "                 $mau_xam(Vui lòng nhấn Yes ở hộp thoại UAC)$mau_khoi_tao" "                 (Vui lòng nhấn Yes ở hộp thoại UAC)"
        Start-Sleep -Milliseconds 600

        # Giai phong mutex truoc khi nang quyen
        if ($script:mutex_ung_dung) {
            try { $script:mutex_ung_dung.ReleaseMutex() } catch {}
            try { $script:mutex_ung_dung.Dispose() } catch {}
            $script:mutex_ung_dung = $null
        }

        $duong_dan_chay = $global:duong_dan_tep_lenh
        $co_wt = (Get-Command wt.exe -ErrorAction SilentlyContinue) -ne $null
        if ($co_wt) {
            Start-Process wt.exe -ArgumentList "cmd.exe /c `"`"$duong_dan_chay`"`" elevated" -Verb RunAs
        } else {
            Start-Process cmd.exe -ArgumentList "/c `"`"$duong_dan_chay`"`" elevated" -Verb RunAs
        }
        [System.Environment]::Exit(0)
    }

    try {
        [DieuKhienChuot]::DatKichThuocVaKhoa(736, 495)
    } catch {}
    try {
        $giao_dien_goc = $Host.UI.RawUI
        $chieu_ngang = [math]::Max(76, $giao_dien_goc.WindowSize.Width)
        $chieu_cao = [math]::Max(22, $giao_dien_goc.WindowSize.Height)
        $giao_dien_goc.BufferSize = New-Object System.Management.Automation.Host.Size($chieu_ngang, $chieu_cao)
    } catch {}

    [Console]::Clear()
    dat_vi_tri_con_tro 0 0
    Write-Host "$mau_toi╭────────────────────────────────────────────────────────────────────────╮$mau_khoi_tao"
    in_dong_khung "$mau_xanh_nhat         TIẾN HÀNH KÍCH HOẠT GÓI GIỌNG NÓI TIẾNG VIỆT                 $mau_khoi_tao" "         TIẾN HÀNH KÍCH HOẠT GÓI GIỌNG NÓI TIẾNG VIỆT                 "
    Write-Host "$mau_toi├────────────────────────────────────────────────────────────────────────┤$mau_khoi_tao"
    in_dong_khung "$mau_vang[1/2] Đang kiểm tra gói giọng nói tiếng Việt trên máy...$mau_khoi_tao" "[1/2] Đang kiểm tra gói giọng nói tiếng Việt trên máy..."

    $da_co_giong_an = Test-Path "HKLM:\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens\MSTTS_V110_viVN_An"
    if (-not $da_co_giong_an) {
        in_dong_khung "    $mau_xam-> Đang tải gói giọng từ máy chủ Microsoft (khoảng 1-2p)...$mau_khoi_tao" "    -> Đang tải gói giọng từ máy chủ Microsoft (khoảng 1-2p)..."

        $tien_trinh_dism = Start-Process -FilePath "dism.exe" -ArgumentList "/Online /Add-Capability /CapabilityName:Language.TextToSpeech~~~vi-VN~0.0.1.0 /Quiet /NoRestart" -WindowStyle Hidden -Wait -PassThru
        if ($tien_trinh_dism.ExitCode -eq 0) {
            in_dong_khung "    $mau_xanh_la[OK] Đã tải và cài đặt thành công gói giọng tiếng Việt!$mau_khoi_tao" "    [OK] Đã tải và cài đặt thành công gói giọng tiếng Việt!"
        } else {
            in_dong_khung "    $mau_do[X] Lỗi tải gói qua DISM. Vui lòng kiểm tra lại kết nối mạng.$mau_khoi_tao" "    [X] Lỗi tải gói qua DISM. Vui lòng kiểm tra lại kết nối mạng."
        }
    } else {
        in_dong_khung "    $mau_xanh_la[OK] Đã tìm thấy dữ liệu gói giọng nói tiếng Việt trên máy!$mau_khoi_tao" "    [OK] Đã tìm thấy dữ liệu gói giọng nói tiếng Việt trên máy!"
        in_dong_khung "    $mau_xam-> Trạng thái: Đã có sẵn trên Windows.$mau_khoi_tao" "    -> Trạng thái: Đã có sẵn trên Windows."
    }

    in_dong_khung "$mau_vang[2/2] Đang kích hoạt giọng Microsoft An cho các trình duyệt...$mau_khoi_tao" "[2/2] Đang kích hoạt giọng Microsoft An cho các trình duyệt..."

    $null = & reg.exe copy "HKLM\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens\MSTTS_V110_viVN_An" "HKLM\SOFTWARE\Microsoft\Speech\Voices\Tokens\MSTTS_V110_viVN_An" /s /f /reg:64 2>&1
    $null = & reg.exe copy "HKLM\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens\MSTTS_V110_viVN_An" "HKLM\SOFTWARE\Microsoft\Speech\Voices\Tokens\TTS_MS_VI-VN_AN_11.0" /s /f /reg:64 2>&1
    $null = & reg.exe copy "HKLM\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens\MSTTS_V110_viVN_An" "HKLM\SOFTWARE\Microsoft\Speech\Voices\Tokens\MSTTS_V110_viVN_An" /s /f /reg:32 2>&1
    $null = & reg.exe copy "HKLM\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens\MSTTS_V110_viVN_An" "HKLM\SOFTWARE\Microsoft\Speech\Voices\Tokens\TTS_MS_VI-VN_AN_11.0" /s /f /reg:32 2>&1

    in_dong_khung "    $mau_xanh_la[OK] Đã kích hoạt thành công cho các trình duyệt!$mau_khoi_tao" "    [OK] Đã kích hoạt thành công cho các trình duyệt!"
    Write-Host "$mau_toi├────────────────────────────────────────────────────────────────────────┤$mau_khoi_tao"
    in_dong_khung "$mau_xanh_la                  [+] HOÀN TẤT THIẾT LẬP THÀNH CÔNG                  $mau_khoi_tao" "                  [+] HOÀN TẤT THIẾT LẬP THÀNH CÔNG                  "
    in_dong_khung "" ""
    in_dong_khung " * Danh sách 3 giọng nói hiện đã sẵn sàng:" " * Danh sách 3 giọng nói hiện đã sẵn sàng:"
    in_dong_khung "    1. Microsoft Hoài My   - Nữ  $mau_xam(chỉ có trên Edge)$mau_khoi_tao" "    1. Microsoft Hoài My   - Nữ  (chỉ có trên Edge)"
    in_dong_khung "    2. Microsoft Nam Minh  - Nam $mau_xam(chỉ có trên Edge)$mau_khoi_tao" "    2. Microsoft Nam Minh  - Nam (chỉ có trên Edge)"
    in_dong_khung "    3. Microsoft An        - Nam $mau_xanh_la(Windows)$mau_khoi_tao" "    3. Microsoft An        - Nam (Windows)"
    in_dong_khung "" ""
    in_dong_khung "$mau_vang_nhat => Vui lòng khởi động lại trình duyệt để áp dụng giọng nói mới!$mau_khoi_tao" " => Vui lòng khởi động lại trình duyệt để áp dụng giọng nói mới!"
    in_dong_khung "" ""

    ve_nut_hoan_tat 0
    in_dong_khung "" ""
    Write-Host "$mau_toi╰────────────────────────────────────────────────────────────────────────╯$mau_khoi_tao" -NoNewline

    cho_dong_ung_dung
}

# Ve nut hoan tat
function ve_nut_hoan_tat($trang_thai_re_chuot, $dang_nhan_chuot = $false) {
    dat_vi_tri_con_tro 0 18
    $chuoi_nut_dong = if ($trang_thai_re_chuot -eq 1) {
        if ($dang_nhan_chuot) { "$nen_nhan_chuot_xanh[    HOÀN TẤT & ĐÓNG    ]$mau_khoi_tao" }
        else { "$nen_re_chuot_xanh[    HOÀN TẤT & ĐÓNG    ]$mau_khoi_tao" }
    } else {
        "$mau_xanh_la[    HOÀN TẤT & ĐÓNG    ]$mau_khoi_tao"
    }

    $dong_mau = "                      $chuoi_nut_dong                       "
    $dong_tho = "                      [    HOÀN TẤT & ĐÓNG    ]                       "
    in_dong_khung $dong_mau $dong_tho
}

# Cho nguoi dung dong ung dung
function cho_dong_ung_dung() {
    $tay_cam_dau_vao = [DieuKhienChuot]::GetStdHandle([DieuKhienChuot]::STD_INPUT_HANDLE)
    try { [DieuKhienChuot]::FlushConsoleInputBuffer($tay_cam_dau_vao) | Out-Null } catch {}
    $danh_sach_ban_ghi = New-Object DieuKhienChuot+INPUT_RECORD[] 64

    $trang_thai_re_chuot_truoc = 0
    $da_nhan_chuot_truoc = $false

    while ($true) {
        Start-Sleep -Milliseconds 25
        [uint32]$so_luong_su_kien = 0
        [DieuKhienChuot]::GetNumberOfConsoleInputEvents($tay_cam_dau_vao, [ref]$so_luong_su_kien) | Out-Null
        if ($so_luong_su_kien -le 0) { continue }

        [uint32]$so_luong_can_doc = [math]::Min([uint32]$danh_sach_ban_ghi.Length, $so_luong_su_kien)
        [uint32]$so_luong_da_doc = 0
        [DieuKhienChuot]::ReadConsoleInput($tay_cam_dau_vao, $danh_sach_ban_ghi, $so_luong_can_doc, [ref]$so_luong_da_doc) | Out-Null

        for ($chi_so = 0; $chi_so -lt $so_luong_da_doc; $chi_so++) {
            $ban_ghi = $danh_sach_ban_ghi[$chi_so]

            # Xu ly ban phim
            if ($ban_ghi.EventType -eq 1 -and $ban_ghi.KeyEvent.bKeyDown -ne 0) {
                $ma_phim = $ban_ghi.KeyEvent.wVirtualKeyCode

                # Bo qua phim bo tro: Shift, Ctrl, Alt, Win, CapsLock, Tab
                if ($ma_phim -in @(0x10, 0x11, 0x12, 0x5B, 0x5C, 0x14, 0x09)) {
                    continue
                }

                # Chi chap nhan Enter, Space, Esc de dong
                if ($ma_phim -in @(0x0D, 0x20, 0x1B)) {
                    ve_nut_hoan_tat 1 $true
                    Start-Sleep -Milliseconds 120
                    return
                }
            }

            # Xu ly chuot
            if ($ban_ghi.EventType -eq 2) {
                $su_kien_chuot = $ban_ghi.MouseEvent
                $toa_do_x = $su_kien_chuot.dwMousePosition.X
                $toa_do_y = $su_kien_chuot.dwMousePosition.Y
                $dang_nhan_chuot_trai = ($su_kien_chuot.dwButtonState -band 1) -ne 0

                $trang_thai_re_chuot_hien_tai = 0
                if ($toa_do_y -eq 18 -and $toa_do_x -ge 24 -and $toa_do_x -le 48) {
                    $trang_thai_re_chuot_hien_tai = 1
                }

                if ($trang_thai_re_chuot_hien_tai -ne $trang_thai_re_chuot_truoc) {
                    $trang_thai_re_chuot_truoc = $trang_thai_re_chuot_hien_tai
                    ve_nut_hoan_tat $trang_thai_re_chuot_hien_tai
                }

                if ($dang_nhan_chuot_trai -and -not $da_nhan_chuot_truoc -and $trang_thai_re_chuot_hien_tai -eq 1) {
                    ve_nut_hoan_tat 1 $true
                    Start-Sleep -Milliseconds 120
                    return
                }
                $da_nhan_chuot_truoc = $dang_nhan_chuot_trai
            }
        }
    }
}

# Diem khoi dau chuong trinh
try {
    if ($la_tien_trinh_nang_quyen) {
        tien_hanh_cai_dat
    } else {
        ve_giao_dien_chinh
        $hanh_dong = cho_thao_tac_nguoi_dung

        if ($hanh_dong -eq 'cai_dat') {
            tien_hanh_cai_dat
        } else {
            dat_vi_tri_con_tro 0 16
            in_dong_khung "$mau_do[!] Bạn đã hủy bỏ cài đặt. Cửa sổ sẽ tự đóng sau 3 giây...$mau_khoi_tao" "[!] Bạn đã hủy bỏ cài đặt. Cửa sổ sẽ tự đóng sau 3 giây..."
            dat_vi_tri_con_tro 0 17
            in_dong_khung "" ""
            for ($giay = 3; $giay -ge 1; $giay--) {
                dat_vi_tri_con_tro 0 18
                $dem_nguoc_mau = "                       $mau_xam[ Tự đóng sau: $giay s ]$mau_khoi_tao"
                $dem_nguoc_tho = "                       [ Tự đóng sau: $giay s ]"
                in_dong_khung $dem_nguoc_mau $dem_nguoc_tho
                Start-Sleep -Seconds 1
            }
            [System.Environment]::Exit(0)
        }
    }
} finally {
    # Giai phong mutex khi ket thuc
    if ($script:mutex_ung_dung) {
        try { $script:mutex_ung_dung.ReleaseMutex() } catch {}
        try { $script:mutex_ung_dung.Dispose() } catch {}
        $script:mutex_ung_dung = $null
    }
}