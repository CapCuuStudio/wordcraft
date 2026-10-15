# LUNOR Apps — Chặng 1: QA của 12 ứng dụng

**Mục tiêu:** phân biệt rõ build thành công, mở chạy được trong browser và *sử dụng được để tạo/lưu/mở lại tài liệu thực tế*. Không sử dụng dữ liệu cá nhân của người dùng.

## Quy trình

1. GitHub Actions mở bản web đã triển khai của đủ 12 ứng dụng trên Chromium độc lập (mỗi ứng dụng một phiên, không chỉnh sửa server/ISO).
2. Kiểm tra HTTP, WebAssembly, canvas, điều kiện boot, lỗi JavaScript nghiêm trọng và chụp màn hình. Mỗi ứng dụng nhận **PASS / FAIL / BLOCKED** theo từng mục.
3. Lưu `status.json`, ảnh `boot.png` và lỗi trình duyệt trong workflow artifacts. Bộ tổng hợp tạo `LUNOR_QA_REPORT.md`. Workflow chỉ coi QA khởi động **PASS** khi có bằng chứng chạy được (không coi giao diện loading là thành công).
4. Chạy tiếp các bài kiểm tra **tạo → chỉnh sửa → lưu → đóng → mở lại → đối chiếu** từ bảng bên dưới. Các bài kiểm thử tài liệu chưa tự động hóa sẽ vẫn giữ trạng thái **CHƯA XÁC MINH**, kể cả khi smoke test boot PASS.
5. Kiểm tra trực tiếp trên Windows và VM LUNOR OS trước phát hành chính thức; Chromium CI không thay thế được QA phần cứng.

| Ứng dụng | Tác vụ nghiệm thu riêng | Trạng thái chức năng |
|---|---|---|
| Photo | PNG → layer/mask → xuất PNG; PSD hai chiều | Chưa kiểm thử |
| Video | Nhập MP4 → cắt timeline → phát → xuất | Chưa kiểm thử |
| Design | Frame/component → xuất SVG; import .fig | Chưa kiểm thử |
| Motion | Composition → keyframe → preview → render | Chưa kiểm thử |
| Layout | Tạo tài liệu nhiều trang → xuất PDF | Chưa kiểm thử |
| Writer | Gõ tiếng Việt → lưu DOCX → mở lại → so khớp | Chỉ gõ tiếng Việt đã được người dùng xác nhận; lưu/mở chưa kiểm thử |
| RAW | Import DNG → chỉnh không phá hủy → xuất JPEG | Chưa kiểm thử |
| Audio | Import WAV → edit track → preview → export WAV | Chưa kiểm thử |
| Sheets | Công thức → lưu XLSX → mở lại; đánh giá số liệu | Chưa kiểm thử |
| Slides | Slide + ảnh → lưu PPTX → mở lại; bố cục | Chưa kiểm thử |
| PDF | Chú thích → lưu PDF → mở lại; không mất trang | Chưa kiểm thử |
| Vector | Vẽ path → xuất SVG → nhập lại | Chưa kiểm thử |

**Phân loại:** P0 (mất dữ liệu/hỏng tệp, crash, bảo mật); P1 (không thể dùng tác vụ cốt lõi); P2 (lỗi giao diện/tương thích); P3 (chính tả/chi tiết nhỏ).

### Nguyên tắc kiểm thử
- Build WASM thành công **không** bằng qua QA giao diện.
- Chỉ chấm PASS cho tiêu chí được quan sát bằng kiểm thử tự động hoặc bằng ảnh/nhật ký người kiểm thử.
- Không tự động đặt nhãn `ổn định`, `beta` hay `đã sẵn sàng phát hành`.
- CI chỉ dùng GitHub-hosted free public runners và Chromium; không mua dịch vụ trả phí.
- Giữ nguyên kết nối cập nhật Craft và không merge/đụng website production.
- Quyền truy cập GitHub Pages, WebGL/WebGPU và thời gian tải tệp lớn có thể ảnh hưởng kết quả. Lỗi môi trường cần tách khỏi lỗi ứng dụng.
