# Hồng Photobooth

Camera với bộ lọc hồng sáng, chụp đếm ngược, 26 khung ảnh và tải PNG. Ảnh chụp được xử lý trên thiết bị của người dùng.

## Cấu trúc GitHub

```text
hong-photobooth/
├── index.html
├── .nojekyll
├── assets/
│   ├── css/
│   ├── js/
│   └── frames/
├── server.cjs
└── README.md
```

Bản GitHub dùng `index.html` và `assets/` ở gốc. Các file trong `dist/`, `filter/` và ảnh demo là bản cũ/tham khảo, không cần đưa lên để chạy trang.

## Chạy thử trên máy

Với Node.js đã được cài, mở terminal trong thư mục này và chạy:

```sh
node server.cjs
```

Mở `http://127.0.0.1:4173`. Nếu cổng đang được sử dụng, dừng phiên chạy trước hoặc đặt biến môi trường `PORT` sang cổng khác.

## Xuất bản

Đưa `index.html`, toàn bộ `assets/` và `.nojekyll` lên repository, giữ nguyên cấu trúc. Bật GitHub Pages cho nhánh chứa mã nguồn và thư mục gốc của repository. Địa chỉ dự kiến của repository hiện tại: `https://23t1020225.github.io/hong-photobooth/`.

Tài nguyên dùng đường dẫn tương đối nên trang chạy được dưới đường dẫn tên repository. Camera cần HTTPS hoặc localhost và quyền truy cập từ trình duyệt. Google Fonts cần mạng; khi không tải được sẽ dùng phông dự phòng.

## Sửa giao diện/chức năng

- Bố cục: `assets/css/style.css`, `assets/css/compact.css`.
- Camera: `assets/js/app.js`.
- Bảng chọn khung và phóng to: `assets/js/compact.js`.
- Khung PNG và vùng ghép: `assets/js/custom-frame-data.js`, `assets/frames/`.
- Khung vẽ bằng mã: `assets/js/frames.js`, `assets/js/couple-frames.js`.

Các lần cập nhật GitHub tiếp theo chỉnh sửa bản trong `assets/`.

## Filter tự bám khuôn mặt

Chọn một filter nhân vật rồi bật camera. Tùy chọn “Tự bám theo khuôn mặt” bật
sẵn: filter theo vị trí, độ nghiêng và kích thước của một khuôn mặt, bao gồm
khi lật gương camera. Khi không thấy mặt, filter tự ẩn. Có thể tắt tùy chọn này
để kéo filter thủ công; thanh kích thước vẫn điều chỉnh được ở cả hai chế độ.

Nhận diện chạy trong Web Worker trên thiết bị, không gửi ảnh hay điểm khuôn mặt
ra máy chủ. Lần mở đầu tiên cần tải khoảng 15 MB tài nguyên từ chính website
(bộ WASM phù hợp và mô hình), sau đó trình duyệt có thể lưu đệm. Giữ đầy đủ
`assets/vendor/mediapipe/` và `assets/models/` khi xuất bản. Nếu thiết bị không
hỗ trợ hoặc tải lỗi, giao diện cho phép thử lại và chuyển sang kéo thủ công.

Kiểm tra logic: `node --test tests/*.test.cjs`.

## Bộ sưu tập 25 filter

Bảng chọn gồm 14 mẫu mới đã duyệt và 11 filter ban đầu, có hình xem trước từ
chính hiệu ứng được vẽ trên camera. Có thể lọc theo Dễ thương, Mặt nạ, Phụ kiện
hoặc Bộ đầu tiên; tùy chọn Không dùng luôn hiện để dễ tắt hiệu ứng.

Các mẫu mới gồm mũ thỏ, tai theo độ cười, mặt nạ hoa, tàn nhang mềm, thỏ trên má,
bướm hồng, gấu trúc, mũ ếch dâu, dâu và hoa, gấu kẹo, kẹp tóc Y2K, sao trên má,
mây trắng và mặt nạ bơ. Đây là các bản vẽ 2D tự dựng theo mẫu tham khảo, không
phải gói hiệu ứng gốc nhập từ TikTok/Instagram. Tai biểu cảm dùng hai chỉ số
mouthSmile để điều chỉnh tai; mặt nạ hoa là hình trang trí 2D, không mô phỏng vải.
