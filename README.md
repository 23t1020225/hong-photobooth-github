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
