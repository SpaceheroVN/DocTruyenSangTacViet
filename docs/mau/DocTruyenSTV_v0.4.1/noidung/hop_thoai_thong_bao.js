'use strict';
// Lightbox thông báo dùng chung trang web và popup

(function () {
    const DUONG_DAN_THONG_BAO_MOI = 'https://raw.githubusercontent.com/SpaceheroVN/DocTruyenSangTacViet/main/THONG_BAO.md';
    const DUONG_DAN_TRANG_GITHUB_THONG_BAO = 'https://github.com/SpaceheroVN/DocTruyenSangTacViet/blob/main/THONG_BAO.md';

    const KHOA_HIEN_CHUONG = 'hien_chuong_thong_bao';
    const KHOA_MOC_DA_DOC = 'moc_thong_bao_da_doc';
    const KHOA_CO_TIN_MOI_CACHE = 'co_tin_moi_thong_bao';
    const KHOA_NOI_DUNG_CACHE = 'noi_dung_thong_bao_cache';
    const KHOA_MOC_CACHE = 'moc_thong_bao_cache';
    const ID_PHONG_CACH = 'stv-thong-bao-lightbox-style';
    const ID_HOP_THOAI = 'stv-thong-bao-lightbox';

    // === Mốc thời gian và dựng DOM Markdown ===

    // Đệm 2 chữ số cho thời gian
    function dem_hai_chu_so(gia_tri) {
        return String(gia_tri).padStart(2, '0');
    }

    // Trích mốc thời gian ở đầu THONG_BAO.md
    function trich_moc_cap_nhat(noi_dung) {
        if (!noi_dung || typeof noi_dung !== 'string') return '';
        const cac_dong_dau = noi_dung
            .replace(/^\uFEFF/, '')
            .split(/\r?\n/)
            .map(dong => dong.trim())
            .filter(Boolean)
            .slice(0, 6);

        for (const dong of cac_dong_dau) {
            let khop = dong.match(/(\d{1,2}):(\d{2})\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (khop) {
                return `${dem_hai_chu_so(khop[1])}:${dem_hai_chu_so(khop[2])} ${dem_hai_chu_so(khop[3])}/${dem_hai_chu_so(khop[4])}/${khop[5]}`;
            }
            khop = dong.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})/);
            if (khop) {
                return `${dem_hai_chu_so(khop[4])}:${dem_hai_chu_so(khop[5])} ${dem_hai_chu_so(khop[1])}/${dem_hai_chu_so(khop[2])}/${khop[3]}`;
            }
            khop = dong.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{2})/);
            if (khop) {
                return `${dem_hai_chu_so(khop[4])}:${dem_hai_chu_so(khop[5])} ${dem_hai_chu_so(khop[3])}/${dem_hai_chu_so(khop[2])}/${khop[1]}`;
            }
        }
        return '';
    }

    // Tạo mã nhận diện theo mốc hoặc băm nội dung
    function lay_dau_nhan_dien(noi_dung, moc_thoi_gian) {
        if (moc_thoi_gian) return moc_thoi_gian;
        const sach = String(noi_dung || '').trim();
        if (!sach) return '';
        let ma_bam = 2166136261;
        for (let i = 0; i < sach.length; i++) {
            ma_bam ^= sach.charCodeAt(i);
            ma_bam = Math.imul(ma_bam, 16777619);
        }
        return `bam:${(ma_bam >>> 0).toString(16)}`;
    }

    // Bỏ dòng "Cập nhật: ..." thừa ở đầu bài
    function tach_phan_than_thong_bao(noi_dung) {
        const cac_dong = String(noi_dung || '').replace(/^\uFEFF/, '').split(/\r?\n/);
        let vi_tri_bat_dau = 0;
        while (vi_tri_bat_dau < cac_dong.length && !cac_dong[vi_tri_bat_dau].trim()) {
            vi_tri_bat_dau++;
        }
        if (vi_tri_bat_dau < cac_dong.length) {
            const dong_dau = cac_dong[vi_tri_bat_dau].trim();
            if (/^(?:>\s*)?(?:\*\*)?cập\s*nhật(?:\*\*)?\s*:/i.test(dong_dau) && trich_moc_cap_nhat(dong_dau)) {
                vi_tri_bat_dau++;
                while (vi_tri_bat_dau < cac_dong.length && !cac_dong[vi_tri_bat_dau].trim()) {
                    vi_tri_bat_dau++;
                }
            }
        }
        return cac_dong.slice(vi_tri_bat_dau).join('\n');
    }

    // Chèn inline Markdown an toàn bằng DOM API
    function chen_inline_markdown_dom(the_cha, van_ban) {
        const mau_inline = /(`[^`]+`)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)/g;
        let vi_tri_cuoi = 0;
        let khop;

        while ((khop = mau_inline.exec(van_ban)) !== null) {
            if (khop.index > vi_tri_cuoi) {
                the_cha.appendChild(document.createTextNode(van_ban.slice(vi_tri_cuoi, khop.index)));
            }
            if (khop[1]) {
                const the_code = document.createElement('code');
                the_code.textContent = khop[1].slice(1, -1);
                the_cha.appendChild(the_code);
            } else if (khop[2]) {
                const the_a = document.createElement('a');
                the_a.href = khop[4];
                the_a.target = '_blank';
                the_a.rel = 'noopener noreferrer';
                chen_inline_markdown_dom(the_a, khop[3]);
                the_cha.appendChild(the_a);
            } else if (khop[5]) {
                const the_dam = document.createElement('strong');
                the_dam.textContent = khop[6];
                the_cha.appendChild(the_dam);
            } else if (khop[7]) {
                const the_nghieng = document.createElement('em');
                the_nghieng.textContent = khop[8];
                the_cha.appendChild(the_nghieng);
            }
            vi_tri_cuoi = mau_inline.lastIndex;
        }

        if (vi_tri_cuoi < van_ban.length) {
            the_cha.appendChild(document.createTextNode(van_ban.slice(vi_tri_cuoi)));
        }
    }

    // Chuyển Markdown sang DocumentFragment an toàn
    function tao_noi_dung_markdown_dom(noi_dung_tho) {
        const manh_dom = document.createDocumentFragment();
        const than_bai = tach_phan_than_thong_bao(noi_dung_tho);
        if (!than_bai.trim()) {
            const p = document.createElement('p');
            p.className = 'stv-tb-empty';
            p.textContent = 'Hiện chưa có nội dung thông báo nào.';
            manh_dom.appendChild(p);
            return manh_dom;
        }

        const cac_dong = than_bai.split(/\r?\n/);
        let danh_sach_hien_tai = null;
        let loai_danh_sach = '';
        let bo_dem_doan = [];

        const xa_doan_van = () => {
            if (bo_dem_doan.length > 0) {
                const p = document.createElement('p');
                bo_dem_doan.forEach((dong_doan, chi_so) => {
                    if (chi_so > 0) p.appendChild(document.createElement('br'));
                    chen_inline_markdown_dom(p, dong_doan);
                });
                manh_dom.appendChild(p);
                bo_dem_doan = [];
            }
        };

        const dong_danh_sach = () => {
            if (danh_sach_hien_tai) {
                manh_dom.appendChild(danh_sach_hien_tai);
                danh_sach_hien_tai = null;
                loai_danh_sach = '';
            }
        };

        for (const dong_goc of cac_dong) {
            const dong = dong_goc.trim();
            if (!dong) {
                xa_doan_van();
                dong_danh_sach();
                continue;
            }

            if (/^(-{3,}|\*{3,})$/.test(dong)) {
                xa_doan_van();
                dong_danh_sach();
                manh_dom.appendChild(document.createElement('hr'));
                continue;
            }

            const khop_tieu_de = dong.match(/^(#{1,3})\s+(.+)$/);
            if (khop_tieu_de) {
                xa_doan_van();
                dong_danh_sach();
                const cap = khop_tieu_de[1].length;
                const ten_the = cap === 1 ? 'h3' : (cap === 2 ? 'h4' : 'h5');
                const the_h = document.createElement(ten_the);
                chen_inline_markdown_dom(the_h, khop_tieu_de[2]);
                manh_dom.appendChild(the_h);
                continue;
            }

            const khop_trich_dan = dong.match(/^>\s*(.+)$/);
            if (khop_trich_dan) {
                xa_doan_van();
                dong_danh_sach();
                const bq = document.createElement('blockquote');
                chen_inline_markdown_dom(bq, khop_trich_dan[1]);
                manh_dom.appendChild(bq);
                continue;
            }

            const khop_ul = dong.match(/^[-*]\s+(.+)$/);
            if (khop_ul) {
                xa_doan_van();
                if (loai_danh_sach !== 'ul') {
                    dong_danh_sach();
                    danh_sach_hien_tai = document.createElement('ul');
                    loai_danh_sach = 'ul';
                }
                const li = document.createElement('li');
                chen_inline_markdown_dom(li, khop_ul[1]);
                danh_sach_hien_tai.appendChild(li);
                continue;
            }

            const khop_ol = dong.match(/^\d+\.\s+(.+)$/);
            if (khop_ol) {
                xa_doan_van();
                if (loai_danh_sach !== 'ol') {
                    dong_danh_sach();
                    danh_sach_hien_tai = document.createElement('ol');
                    loai_danh_sach = 'ol';
                }
                const li = document.createElement('li');
                chen_inline_markdown_dom(li, khop_ol[1]);
                danh_sach_hien_tai.appendChild(li);
                continue;
            }

            dong_danh_sach();
            bo_dem_doan.push(dong);
        }

        xa_doan_van();
        dong_danh_sach();
        return manh_dom;
    }

    // === CSS và Lightbox thông báo ===

    // Chèn style cô lập cho Lightbox thông báo
    function dam_bao_phong_cach_lightbox() {
        if (document.getElementById(ID_PHONG_CACH)) return;
        const style = document.createElement('style');
        style.id = ID_PHONG_CACH;
        style.textContent = `
            #${ID_HOP_THOAI} {
                position: fixed; inset: 0; z-index: 2147483647;
                display: flex; align-items: center; justify-content: center;
                padding: 24px; box-sizing: border-box;
                opacity: 0; transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                background: rgba(8, 7, 14, 0.82);
                text-align: left;
            }
            #${ID_HOP_THOAI}[data-theme="light"] {
                background: rgba(18, 14, 28, 0.65);
            }
            #${ID_HOP_THOAI} * {
                box-sizing: border-box;
            }

            #${ID_HOP_THOAI} .stv-tb-dialog {
                width: min(620px, 92vw); max-height: 88vh;
                display: flex; flex-direction: column; overflow: hidden;
                border-radius: 16px;
                transform: scale(0.92) translateY(10px);
                transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, color 0.25s ease;
                background: linear-gradient(145deg, #181528 0%, #100e1c 100%);
                color: #f0edf7;
                border: 1.5px solid rgba(232, 160, 69, 0.35);
                box-shadow: 0 28px 75px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(232, 160, 69, 0.25), 0 0 35px rgba(232, 160, 69, 0.2);
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-dialog {
                background: #ffffff;
                color: #13111f;
                border: 1px solid #d4cee5;
                box-shadow: 0 22px 60px rgba(24, 21, 40, 0.22);
            }

            #${ID_HOP_THOAI} .stv-tb-header {
                padding: 14px 20px;
                display: flex; align-items: center; justify-content: space-between;
                gap: 16px; flex-shrink: 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                background: rgba(232, 160, 69, 0.04);
                transition: background 0.25s ease, border-color 0.25s ease;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-header {
                border-bottom: 1px solid #d4cee5;
                background: #ffffff;
            }

            #${ID_HOP_THOAI} .stv-tb-title-wrap {
                display: flex; align-items: center; gap: 10px; min-width: 0;
            }
            #${ID_HOP_THOAI} .stv-tb-title-wrap svg {
                flex-shrink: 0; stroke: #e8a045;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-title-wrap svg {
                stroke: #f27212;
            }
            #${ID_HOP_THOAI} .stv-tb-title-col {
                display: flex; flex-direction: column; gap: 2px; min-width: 0;
            }
            #${ID_HOP_THOAI} .stv-tb-title {
                font-size: 15px; font-weight: 700; line-height: 1.25;
                color: #ffffff; margin: 0;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-title {
                color: #13111f;
            }
            #${ID_HOP_THOAI} .stv-tb-updated {
                font-size: 11px; color: #a09cb0; line-height: 1.2;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-updated {
                color: #544e6e;
            }

            #${ID_HOP_THOAI} .stv-tb-close {
                width: 32px; height: 32px; min-width: 0; min-height: 0;
                border-radius: 8px; cursor: pointer;
                display: inline-flex; align-items: center; justify-content: center;
                padding: 0; margin: 0; line-height: 0; font-size: 0; box-sizing: border-box;
                appearance: none; -webkit-appearance: none; overflow: visible;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #a09cb0;
                transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
                flex-shrink: 0;
            }
            #${ID_HOP_THOAI} .stv-tb-close svg {
                width: 16px; height: 16px; min-width: 0; min-height: 0;
                margin: 0; padding: 0; display: block; flex-shrink: 0;
                pointer-events: none; overflow: visible;
            }
            #${ID_HOP_THOAI} .stv-tb-close .stv-tb-close-x {
                transform-origin: 12px 12px;
                transform-box: view-box;
                transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);
                will-change: transform;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-close {
                background: rgba(0, 0, 0, 0.05);
                border: 1px solid rgba(0, 0, 0, 0.08);
                color: #5a566f;
            }
            #${ID_HOP_THOAI} .stv-tb-close:hover {
                background: rgba(239, 68, 68, 0.18) !important;
                border-color: rgba(239, 68, 68, 0.5) !important;
                color: #ef4444 !important;
            }
            #${ID_HOP_THOAI} .stv-tb-close:hover .stv-tb-close-x {
                transform: rotate(90deg);
            }

            #${ID_HOP_THOAI} .stv-tb-body {
                padding: 20px 24px;
                overflow-y: auto; flex: 1; min-height: 180px;
                background: rgba(0, 0, 0, 0.36);
                transition: background 0.25s ease;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-body {
                background: #ece9f5;
                padding: 16px;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-body .stv-tb-md,
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-body .stv-tb-state {
                background: #ffffff;
                border: 1px solid #d4cee5;
                border-radius: 10px;
                padding: 16px 18px;
                color: #13111f;
            }
            #${ID_HOP_THOAI} .stv-tb-body::-webkit-scrollbar {
                width: 7px;
            }
            #${ID_HOP_THOAI} .stv-tb-body::-webkit-scrollbar-track {
                background: transparent;
            }
            #${ID_HOP_THOAI} .stv-tb-body::-webkit-scrollbar-thumb {
                background: rgba(160, 156, 176, 0.35);
                border-radius: 99px;
            }
            #${ID_HOP_THOAI} .stv-tb-body::-webkit-scrollbar-thumb:hover {
                background: #e8a045;
            }

            #${ID_HOP_THOAI} .stv-tb-md {
                font-size: 13px; line-height: 1.65; color: #e8e6f0;
                word-break: break-word;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-md {
                color: #13111f;
            }
            #${ID_HOP_THOAI} .stv-tb-md h3 {
                font-size: 15px; font-weight: 700; color: #e8a045;
                margin: 0 0 12px; padding: 0; line-height: 1.35;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-md h3 {
                color: #f27212;
            }
            #${ID_HOP_THOAI} .stv-tb-md h4 {
                font-size: 13px; font-weight: 700; color: #ffffff;
                margin: 16px 0 8px; padding: 0; line-height: 1.35;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-md h4 {
                color: #13111f;
            }
            #${ID_HOP_THOAI} .stv-tb-md h5 {
                font-size: 13px; font-weight: 600;
                margin: 12px 0 6px; padding: 0; line-height: 1.35;
            }
            #${ID_HOP_THOAI} .stv-tb-md p {
                margin: 0 0 10px; padding: 0; color: inherit;
            }
            #${ID_HOP_THOAI} .stv-tb-md p:last-child,
            #${ID_HOP_THOAI} .stv-tb-md ul:last-child,
            #${ID_HOP_THOAI} .stv-tb-md ol:last-child {
                margin-bottom: 0;
            }
            /* ========== Thành phần danh sách, trích dẫn và liên kết Markdown ========== */
            #${ID_HOP_THOAI} .stv-tb-md ul,
            #${ID_HOP_THOAI} .stv-tb-md ol {
                margin: 0 0 10px; padding-left: 22px;
            }
            #${ID_HOP_THOAI} .stv-tb-md ul {
                list-style: disc;
            }
            #${ID_HOP_THOAI} .stv-tb-md ol {
                list-style: decimal;
            }
            #${ID_HOP_THOAI} .stv-tb-md li {
                margin-bottom: 5px;
            }
            #${ID_HOP_THOAI} .stv-tb-md blockquote {
                margin: 12px 0; padding: 8px 14px;
                border-left: 3px solid #e8a045;
                background: rgba(232, 160, 69, 0.08);
                border-radius: 0 8px 8px 0;
                color: #c5c1d6; font-size: 11px;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-md blockquote {
                border-left-color: #f27212;
                background: #f5f3fa;
                color: #544e6e;
            }
            #${ID_HOP_THOAI} .stv-tb-md hr {
                border: none; border-top: 1px dashed rgba(255, 255, 255, 0.14);
                margin: 14px 0;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-md hr {
                border-top-color: #d4cee5;
            }
            #${ID_HOP_THOAI} .stv-tb-md code {
                font-family: Consolas, Monaco, monospace; font-size: 11px;
                padding: 1px 6px; border-radius: 5px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #f8d29c;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-md code {
                background: #f3f1f9;
                border-color: #d4cee5;
                color: #c2410c;
            }
            #${ID_HOP_THOAI} .stv-tb-md a,
            #${ID_HOP_THOAI} .stv-tb-state a {
                color: #e8a045; text-decoration: underline; text-underline-offset: 2px;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-md a,
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-state a {
                color: #ea580c;
            }
            #${ID_HOP_THOAI} .stv-tb-state {
                font-size: 13px; line-height: 1.6; color: #a09cb0;
                text-align: center; padding: 26px 12px;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-state {
                color: #544e6e;
            }
            #${ID_HOP_THOAI} .stv-tb-state p {
                margin: 0 0 8px;
            }

            #${ID_HOP_THOAI} .stv-tb-footer {
                padding: 14px 20px; flex-shrink: 0;
                display: flex; align-items: center; justify-content: space-between;
                gap: 14px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                background: #12101e;
                transition: background 0.25s ease, border-color 0.25s ease;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-footer {
                border-top: 1px solid #d4cee5;
                background: #ffffff;
            }

            #${ID_HOP_THOAI} .stv-tb-toggle-wrap {
                display: inline-flex; align-items: center; gap: 9px;
                font-size: 13px; font-weight: 500; color: #c5c1d6;
                cursor: pointer; user-select: none; margin: 0;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-toggle-wrap {
                color: #544e6e;
            }
            #${ID_HOP_THOAI} .stv-tb-switch {
                position: relative; display: inline-block;
                width: 32px; height: 18px; flex-shrink: 0;
            }
            #${ID_HOP_THOAI} .stv-tb-switch input {
                opacity: 0; width: 0; height: 0; position: absolute; pointer-events: none; margin: 0;
            }
            #${ID_HOP_THOAI} .stv-tb-slider {
                position: absolute; inset: 0; border-radius: 99px;
                background: #26243b; border: 1px solid #3c3957;
                transition: all 0.22s ease;
            }
            #${ID_HOP_THOAI} .stv-tb-slider::before {
                content: ''; position: absolute; width: 12px; height: 12px;
                left: 2px; top: 2px; border-radius: 50%; background: #94a3b8;
                transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease;
            }
            #${ID_HOP_THOAI} .stv-tb-switch input:checked + .stv-tb-slider {
                background: linear-gradient(135deg, #ff751f 0%, #e65c00 100%);
                border-color: #ea580c;
                box-shadow: 0 0 8px rgba(255, 117, 31, 0.42);
            }
            #${ID_HOP_THOAI} .stv-tb-switch input:checked + .stv-tb-slider::before {
                transform: translateX(14px); background: #ffffff;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-slider {
                background: #e2e8f0; border-color: #cbd5e1;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-slider::before {
                background: #ffffff;
            }

            #${ID_HOP_THOAI} .stv-tb-btn-dong {
                position: relative;
                display: inline-flex; align-items: center; justify-content: center;
                padding: 8px 18px; border-radius: 9px; margin: 0;
                font-size: 13px; font-weight: 600; cursor: pointer;
                background: rgba(255, 255, 255, 0.07);
                color: #d0cce0;
                border: 1.5px solid rgba(255, 255, 255, 0.14);
                transition: all 0.18s ease;
            }
            #${ID_HOP_THOAI} .stv-tb-btn-dong:hover {
                background: rgba(255, 255, 255, 0.16);
                border-color: #e8a045; color: #ffffff;
                transform: translateY(-1px);
                box-shadow: 0 4px 14px rgba(232, 160, 69, 0.25);
            }
            /* Giữ vùng hover bám sát đáy gốc khi nút dịch chuyển lên 1px */
            #${ID_HOP_THOAI} .stv-tb-btn-dong:hover::after {
                content: ''; position: absolute; left: -2px; right: -2px; top: calc(100% - 2px); height: 6px;
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-btn-dong {
                background: #f3f1f9; color: #13111f;
                border: 1px solid #d4cee5;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
            }
            #${ID_HOP_THOAI}[data-theme="light"] .stv-tb-btn-dong:hover {
                background: #f3f0fa; border-color: #ea580c; color: #ea580c;
                box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    // Dựng thân Lightbox cho nội dung, tải và lỗi
    function do_noi_dung_lightbox(khung_than, nhan_cap_nhat, noi_dung_tho, moc_cap_nhat, dang_tai) {
        if (nhan_cap_nhat) {
            if (moc_cap_nhat) {
                nhan_cap_nhat.textContent = `Cập nhật: ${moc_cap_nhat}`;
                nhan_cap_nhat.style.display = 'block';
            } else {
                nhan_cap_nhat.textContent = '';
                nhan_cap_nhat.style.display = 'none';
            }
        }

        khung_than.textContent = '';
        if (noi_dung_tho && noi_dung_tho.trim()) {
            const hop_md = document.createElement('div');
            hop_md.className = 'stv-tb-md';
            hop_md.appendChild(tao_noi_dung_markdown_dom(noi_dung_tho));
            khung_than.appendChild(hop_md);
        } else {
            const khung_tt = document.createElement('div');
            khung_tt.className = 'stv-tb-state';
            if (dang_tai) {
                const p = document.createElement('p');
                p.textContent = 'Đang tải thông báo từ GitHub...';
                khung_tt.appendChild(p);
            } else {
                const p1 = document.createElement('p');
                p1.textContent = 'Hiện chưa thể tải thông báo từ GitHub.';
                const p2 = document.createElement('p');
                p2.appendChild(document.createTextNode('Vui lòng kiểm tra kết nối mạng hoặc xem trực tiếp tại '));
                const a = document.createElement('a');
                a.href = DUONG_DAN_TRANG_GITHUB_THONG_BAO;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = 'THONG_BAO.md trên GitHub';
                p2.appendChild(a);
                p2.appendChild(document.createTextNode('.'));
                khung_tt.appendChild(p1);
                khung_tt.appendChild(p2);
            }
            khung_than.appendChild(khung_tt);
        }
        khung_than.scrollTop = 0;
    }

    // Mở Lightbox xem thông báo giữa màn hình
    function mo_lightbox_thong_bao(tuy_chon) {
        const du_lieu = tuy_chon || {};
        const cu = document.getElementById(ID_HOP_THOAI);
        if (cu) {
            if (typeof cu.stv_huy_bo === 'function') cu.stv_huy_bo();
            cu.remove();
        }

        dam_bao_phong_cach_lightbox();

        const chu_de_hien_tai = du_lieu.chu_de === 'light' ? 'light' : 'dark';
        const overlay = document.createElement('div');
        overlay.id = ID_HOP_THOAI;
        overlay.setAttribute('data-theme', chu_de_hien_tai);
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        const dialog = document.createElement('div');
        dialog.className = 'stv-tb-dialog';

        // Phần đầu gồm chuông, tiêu đề, mốc và nút đóng
        const header = document.createElement('div');
        header.className = 'stv-tb-header';

        const khung_tieu_de = document.createElement('div');
        khung_tieu_de.className = 'stv-tb-title-wrap';
        khung_tieu_de.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
        `;

        const cot_tieu_de = document.createElement('div');
        cot_tieu_de.className = 'stv-tb-title-col';
        const tieu_de = document.createElement('div');
        tieu_de.className = 'stv-tb-title';
        tieu_de.textContent = 'Thông báo';
        const nhan_cap_nhat = document.createElement('div');
        nhan_cap_nhat.className = 'stv-tb-updated';
        cot_tieu_de.appendChild(tieu_de);
        cot_tieu_de.appendChild(nhan_cap_nhat);
        khung_tieu_de.appendChild(cot_tieu_de);
        header.appendChild(khung_tieu_de);

        const nut_dong_x = document.createElement('button');
        nut_dong_x.type = 'button';
        nut_dong_x.className = 'stv-tb-close';
        nut_dong_x.title = 'Đóng (ESC)';
        nut_dong_x.setAttribute('aria-label', 'Đóng thông báo');
        nut_dong_x.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><g class="stv-tb-close-x"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></g></svg>';
        header.appendChild(nut_dong_x);
        dialog.appendChild(header);

        // Thân cuộn chứa nội dung thông báo
        const body = document.createElement('div');
        body.className = 'stv-tb-body';
        const noi_dung_ban_dau = du_lieu.noi_dung_tho || '';
        const moc_ban_dau = du_lieu.moc_cap_nhat || trich_moc_cap_nhat(noi_dung_ban_dau);
        do_noi_dung_lightbox(body, nhan_cap_nhat, noi_dung_ban_dau, moc_ban_dau, !noi_dung_ban_dau);
        dialog.appendChild(body);

        // Chân hộp thoại gồm công tắc chuông và nút Đóng
        const footer = document.createElement('div');
        footer.className = 'stv-tb-footer';

        const nhan_gat = document.createElement('label');
        nhan_gat.className = 'stv-tb-toggle-wrap';
        nhan_gat.title = 'Bật để luôn hiển thị nút chuông ở chân trang ngay cả khi không có thông báo mới';

        const bo_gat = document.createElement('span');
        bo_gat.className = 'stv-tb-switch';
        const o_kiem = document.createElement('input');
        o_kiem.type = 'checkbox';
        o_kiem.checked = du_lieu.luon_hien_chuong !== false;
        const thanh_truot = document.createElement('span');
        thanh_truot.className = 'stv-tb-slider';
        bo_gat.appendChild(o_kiem);
        bo_gat.appendChild(thanh_truot);

        const chu_gat = document.createElement('span');
        chu_gat.textContent = 'Luôn hiện chuông';
        nhan_gat.appendChild(bo_gat);
        nhan_gat.appendChild(chu_gat);
        footer.appendChild(nhan_gat);

        const nut_dong_chan = document.createElement('button');
        nut_dong_chan.type = 'button';
        nut_dong_chan.className = 'stv-tb-btn-dong';
        nut_dong_chan.textContent = 'Đóng';
        footer.appendChild(nut_dong_chan);

        dialog.appendChild(footer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Lưu công tắc vào local/sync, xóa khóa khi mặc định
        o_kiem.addEventListener('change', () => {
            try {
                const gia_tri = Boolean(o_kiem.checked);
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    if (gia_tri) chrome.storage.local.remove(KHOA_HIEN_CHUONG);
                    else chrome.storage.local.set({ [KHOA_HIEN_CHUONG]: 0 });
                }
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                    if (gia_tri) chrome.storage.sync.remove(KHOA_HIEN_CHUONG);
                    else chrome.storage.sync.set({ [KHOA_HIEN_CHUONG]: 0 });
                }
            } catch (_) {}
        });

        // Đồng bộ đổi chủ đề sáng tối khi đang mở
        const lang_nghe_chu_de = (thay_doi, vung_chon) => {
            if ((vung_chon === 'sync' || vung_chon === 'local') && thay_doi.giao_dien_chu_de) {
                const v = thay_doi.giao_dien_chu_de.newValue;
                const chu_de_moi = (v === 'light' || v === 1 || v === '1')
                    ? 'light'
                    : ((v === 'dark' || v === 0 || v === '0')
                        ? 'dark'
                        : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
                overlay.setAttribute('data-theme', chu_de_moi);
            }
        };
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
                chrome.storage.onChanged.addListener(lang_nghe_chu_de);
            }
        } catch (_) {}

        let da_dong = false;
        const huy_lang_nghe = () => {
            document.removeEventListener('keydown', xu_ly_phim);
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
                    chrome.storage.onChanged.removeListener(lang_nghe_chu_de);
                }
            } catch (_) {}
        };
        overlay.stv_huy_bo = huy_lang_nghe;

        const dong_hop_thoai = () => {
            if (da_dong) return;
            da_dong = true;
            overlay.style.opacity = '0';
            dialog.style.transform = 'scale(0.95)';
            huy_lang_nghe();
            setTimeout(() => overlay.remove(), 200);
        };

        const xu_ly_phim = (su_kien) => {
            if (su_kien.key === 'Escape') {
                su_kien.preventDefault();
                dong_hop_thoai();
            }
        };
        document.addEventListener('keydown', xu_ly_phim);
        overlay.addEventListener('click', (su_kien) => {
            if (su_kien.target === overlay) dong_hop_thoai();
        });
        nut_dong_x.addEventListener('click', dong_hop_thoai);
        nut_dong_chan.addEventListener('click', dong_hop_thoai);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            dialog.style.transform = 'scale(1)';
        });

        // Tự tải từ GitHub nếu mở trước khi popup nạp xong
        if (!noi_dung_ban_dau.trim()) {
            const bo_huy = new AbortController();
            const het_gio = setTimeout(() => bo_huy.abort(), 6000);
            fetch(DUONG_DAN_THONG_BAO_MOI, { cache: 'no-store', signal: bo_huy.signal })
                .then(res => (res.ok ? res.text() : ''))
                .then(van_ban => {
                    if (!overlay.isConnected) return;
                    const moc_moi = trich_moc_cap_nhat(van_ban);
                    do_noi_dung_lightbox(body, nhan_cap_nhat, van_ban, moc_moi, false);
                    if (van_ban && van_ban.trim()) {
                        const dau_doc = lay_dau_nhan_dien(van_ban, moc_moi);
                        try {
                            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                                const du_lieu_cache = {
                                    [KHOA_NOI_DUNG_CACHE]: van_ban,
                                    [KHOA_MOC_DA_DOC]: dau_doc
                                };
                                if (moc_moi) du_lieu_cache[KHOA_MOC_CACHE] = moc_moi;
                                chrome.storage.local.set(du_lieu_cache);
                                const khoa_xoa = [KHOA_CO_TIN_MOI_CACHE];
                                if (!moc_moi) khoa_xoa.push(KHOA_MOC_CACHE);
                                chrome.storage.local.remove(khoa_xoa);
                            }
                        } catch (_) {}
                    }
                })
                .catch(() => {
                    if (overlay.isConnected) {
                        do_noi_dung_lightbox(body, nhan_cap_nhat, '', '', false);
                    }
                })
                .finally(() => clearTimeout(het_gio));
        }
    }

    globalThis.DocTruyenSTV_ThongBaoUI = {
        trich_moc_cap_nhat,
        lay_dau_nhan_dien,
        tao_noi_dung_markdown_dom,
        mo_lightbox_thong_bao
    };
})();
