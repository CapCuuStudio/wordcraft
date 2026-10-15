# LUNOR QA · Báo cáo kiểm tra cấu trúc (15/10/2026)

**Nguồn bằng chứng:** GitHub Contents API, nhánh `gh-pages` của `CapCuuStudio/wordcraft`, 12 thư mục `lunor-<slug>/`, kết quả build Workflow #38602968623 và #38598750265.

**Phạm vi:** kiểm tra tồn tại và dung lượng > 0 của `index.html`, tệp `.wasm`, `.js`, mã định danh canvas. Không thực thi WebAssembly ở bước này. Dung lượng là **binary WASM chưa nén**, không phải bộ cài desktop.

| Ứng dụng | Mã nguồn | WASM chưa nén | Tệp ở thư mục gốc | Cấu trúc | Chromium boot | Tác vụ chức năng |
|---|---|---:|---:|---|---|---|
| LUNOR Photo | `photocraft` | 23.9 MiB | 4 | Đạt | Chưa chạy | Chưa kiểm thử |
| LUNOR Video | `filmcraft` | 39.3 MiB | 6 | Đạt | Chưa chạy | Chưa kiểm thử |
| LUNOR Design | `figcraft` | 19.9 MiB | 4 | Đạt | Chưa chạy | Chưa kiểm thử |
| LUNOR Motion | `effectcraft` | 59.6 MiB | 11 | Đạt | Chưa chạy | Chưa kiểm thử |
| LUNOR Layout | `designcraft` | 37.7 MiB | 4 | Đạt | Chưa chạy | Chưa kiểm thử |
| LUNOR Writer | `wordcraft` | 37.9 MiB | 5 | Đạt | Chưa chạy | Chưa kiểm thử |
| LUNOR RAW | `lightcraft` | 21.5 MiB | 13 | Đạt | Chưa chạy | Chưa kiểm thử |
| LUNOR Audio | `soundcraft` | 14.7 MiB | 5 | Đạt | Chưa chạy | Chưa kiểm thử |
| LUNOR Sheets | `gridcraft` | 18.0 MiB | 5 | Đạt | Chưa chạy | Chưa kiểm thử |
| LUNOR Slides | `deckcraft` | 24.3 MiB | 5 | Đạt | Chưa chạy | Chưa kiểm thử |
| LUNOR PDF | `pdfcraft` | 36.3 MiB | 4 | Đạt | Chưa chạy | Chưa kiểm thử |
| LUNOR Vector | `vectorcraft` | 57.6 MiB | 4 | Đạt | Chưa chạy | Chưa kiểm thử |

## Tổng kết minh chứng
- **12/12 PASS — kiểm tra cấu trúc:** tất cả thư mục có index, JS, WASM hợp lệ theo thông tin GitHub và canvas tương ứng. Không kiểm tra tính đầy đủ của mọi file tham chiếu gián tiếp hoặc hành vi thực thi.
- **12/12 build thành công** theo workflow xuất bản trước đó, nhưng build không bảo đảm chất lượng tác vụ.
- **0/12 Chrome CI mới có kết quả:** workflow QA Stage 1 đã được tạo và nối với quy trình LUNOR Writer, nhưng tính đến thời điểm lập báo cáo GitHub chưa có workflow run/check run tương ứng trên nhánh `feat/lunor-qa-stage-1`. Không quy lỗi cho app nếu runner chưa chạy.
- **1/12 có bằng chứng khởi động từ người dùng:** Writer đã hiển thị và gõ tiếng Việt, qua ảnh người dùng gửi; chưa xác minh lưu DOCX và mở lại.
- **0/12 đạt kiểm thử tạo → lưu → đóng → mở lại → so sánh:** chưa có bằng chứng hoàn tất các bước này. Không coi là lỗi; trạng thái NOT_TESTED.

## Chặn phát hành
- **QA-RUNNER-001 (blocker quy trình):** cần làm rõ vì sao GitHub Actions không sinh runner/checks của nhánh QA mới. Mở Actions của repo và kiểm tra quyền, chế độ phê duyệt workflow, thông báo lỗi. Không bật thanh toán hoặc dịch vụ trả phí.
- **QA-FUNCTIONAL-001 (P0 khi có bằng chứng):** tạo tập dữ liệu thử gồm DOCX/XLSX/PPTX/PDF và tệp ảnh/âm thanh/video; đối chiếu tính toàn vẹn sau lưu/mở. Hiện chưa đủ dữ kiện để phân loại lỗi ứng dụng.
- **QA-PLATFORM-001:** chạy trực tiếp trên Windows và VM LUNOR OS, tách biệt khỏi trình duyệt Chromium GitHub Actions.

Mọi sản phẩm vẫn trên nhánh thử nghiệm. Không thay đổi web production/ISO.
