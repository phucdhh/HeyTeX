# Users Data Directory

Thư mục này lưu trữ dữ liệu và projects của tất cả người dùng trong HeyTeX.

## Cấu trúc thư mục

```
users/
├── {userId}/                    # Thư mục của từng user (tên = ID của user)
│   ├── {projectId}/            # Thư mục của từng project
│   │   ├── metadata.json       # Thông tin metadata của project
│   │   └── files/              # Các files của project
│   │       ├── main.tex
│   │       ├── chapters/
│   │       │   ├── chapter1.tex
│   │       │   └── chapter2.tex
│   │       └── images/
│   │           └── logo.png
│   └── {projectId}/
│       └── ...
└── {userId}/
    └── ...
```

## Mô tả

- **User Directory (`{userId}/`)**: Mỗi user có một thư mục riêng được đặt tên theo user ID (UUID)
- **Project Directory (`{projectId}/`)**: Trong thư mục user, mỗi project có một thư mục riêng
- **metadata.json**: Lưu thông tin metadata của project (tên, ngày tạo, cài đặt compiler, etc.)
- **files/**: Chứa tất cả các files của project, bao gồm cả thư mục con

## Quản lý

- Backend service `FileStorage` tự động tạo và quản lý cấu trúc này
- Các thao tác CRUD (Create, Read, Update, Delete) được xử lý thông qua API
- Files binary lớn có thể được lưu song song trên MinIO để tối ưu hiệu suất

## Bảo mật

- Mỗi user chỉ có quyền truy cập vào thư mục của chính họ
- Backend middleware xác thực và phân quyền cho mọi thao tác
- Không nên truy cập trực tiếp vào thư mục này từ bên ngoài

## Backup

Khuyến nghị backup định kỳ toàn bộ thư mục `users/` để đảm bảo an toàn dữ liệu.

## Lưu ý

- Thư mục này được tạo tự động khi khởi động server
- Không xóa thủ công các thư mục user/project trừ khi cần thiết
- Cấu trúc này được đồng bộ với database PostgreSQL
