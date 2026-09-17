# TroManage - Hệ Thống Quản Lý Nhà Trọ Hoàn Chỉnh (Production-Ready MVP)

**TroManage** là nền tảng SaaS hiện đại phục vụ quản lý khu nhà trọ, chung cư mini, phòng cho thuê và cổng dịch vụ cư dân trực tuyến. Hệ thống được xây dựng với kiến trúc chuẩn Full-Stack, giao diện người dùng chuyên nghiệp, hỗ trợ phân quyền vai trò (`ADMIN` & `USER` / `TENANT`), kết nối trực tiếp cơ sở dữ liệu quan hệ **PostgreSQL** thông qua **Prisma ORM**.

---

## 1. Công nghệ sử dụng (Tech Stack)

### Frontend
- **Framework**: Next.js 14 (App Router) & TypeScript
- **Styling**: Tailwind CSS & Vanilla CSS Design System
- **Icons**: Lucide Icons
- **Biểu đồ & Thống kê**: Recharts
- **Toast Notifications**: Sonner
- **Form & Validation**: React Hook Form, Zod

### Backend & Database
- **API Architecture**: Next.js Route Handlers (`/api/*`)
- **Database**: PostgreSQL (không yêu cầu Docker, chạy trực tiếp với PostgreSQL cục bộ)
- **ORM**: Prisma ORM (12 Entities quan hệ chuẩn, Foreign Keys, Cascades & Indexes)
- **Authentication**: JWT Cookie HTTP-Only + BcryptJS + Jose
- **Phân quyền & Bảo mật**: Next.js Middleware chặn RBAC, kiểm tra quyền sở hữu IDOR ở tầng API

---

## 2. Tài khoản thử nghiệm (Development Accounts)

Hệ thống đã được nạp dữ liệu mẫu hoàn chỉnh với 2 role:

| Vai trò | Email đăng nhập | Mật khẩu | Trang đích sau đăng nhập |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin@nhatro.local` | `Admin123!` | `/admin/dashboard` |
| **Khách thuê (USER)** | `user@nhatro.local` | `User123!` | `/dashboard` |

*Ghi chú: Tại trang đăng nhập (`/login`), hệ thống có sẵn 2 nút **"Điền Quản Trị"** và **"Điền Khách Thuê"** để đăng nhập thử nghiệm ngay lập tức.*

---

## 3. Các chức năng chính

### 👑 Quản trị viên (ADMIN)
1. **Tổng quan (Dashboard)**:
   - Thống kê thời gian thực: Tổng số phòng, phòng đang thuê, phòng trống, phòng bảo trì, tổng cư dân.
   - Báo cáo tài chính: Doanh thu thực thu trong tháng, công nợ chưa thu, số hóa đơn quá hạn.
   - Biểu đồ doanh thu 6 tháng (Recharts) và Biểu đồ tỷ lệ lấp đầy phòng.
   - Bảng hóa đơn và thanh toán gần nhất.
2. **Quản lý Khu trọ (`/admin/properties`)**:
   - Thêm, sửa, xóa các tòa nhà / khu trọ.
   - Xem tổng số phòng, phòng trống, khách đang ở theo từng khu.
3. **Quản lý Phòng trọ (`/admin/rooms`)**:
   - Thêm, sửa, xóa phòng, phân tầng, diện tích, giá thuê, tiền cọc, đơn giá điện nước.
   - Lọc theo Khu trọ, Trạng thái (Trống, Đang thuê, Bảo trì), Tầng.
   - Chặn xóa phòng đang có hợp đồng hoạt động.
4. **Quản lý Khách thuê (`/admin/tenants`)**:
   - Quản lý hồ sơ cư dân: CCCD, ngày sinh, giới tính, quê quán, SĐT, email.
   - Bố trí phòng, đổi phòng cho cư dân.
   - Xem hồ sơ chi tiết: Hợp đồng đã ký, lịch sử hóa đơn và các lần thanh toán.
5. **Quản lý Hợp đồng (`/admin/contracts`)**:
   - Lập hợp đồng mới, gia hạn, chấm dứt / thanh lý.
   - Tự động chuyển `Room.status = OCCUPIED` khi hợp đồng hiệu lực.
   - Tự động chuyển `Room.status = AVAILABLE` khi thanh lý và không còn khách khác.
6. **Quản lý Điện & Nước (`/admin/utilities`)**:
   - Nhập chỉ số công tơ điện và đồng hồ nước theo từng tháng.
   - Kiểm tra ràng buộc: `chỉ số mới >= chỉ số cũ`.
   - Tự động tính lượng tiêu thụ (kWh, m³) và thành tiền theo đơn giá phòng.
   - Xem lịch sử biến động điện nước qua các tháng của từng phòng.
7. **Quản lý Dịch vụ (`/admin/services`)**:
   - Cấu hình Internet, Rác, Gửi xe, Thang máy, Dọn dẹp với 4 cách tính phí: `PER_ROOM`, `PER_PERSON`, `FIXED`, `QUANTITY`.
8. **Quản lý Hóa đơn (`/admin/invoices`)**:
   - Tự động tính tổng tiền: `Phòng + Điện + Nước + Dịch vụ + Phí khác + Nợ cũ - Giảm giá`.
   - **Phát hành hóa đơn hàng loạt tự động** cho tất cả phòng đang thuê từ số liệu điện nước và dịch vụ.
   - Tự động chuyển trạng thái `OVERDUE` nếu quá hạn `dueDate`.
   - Xem bản kê chi tiết và hỗ trợ in/xuất phiếu hóa đơn.
9. **Quản lý Thu tiền & Thanh toán (`/admin/payments`)**:
   - Ghi nhận thanh toán (Chuyển khoản, Tiền mặt).
   - Hỗ trợ thanh toán từng phần; tự động chuyển hóa đơn sang `PAID` khi thu đủ tiền.
10. **Quản lý Thông báo (`/admin/notifications`)**:
    - Phát thông báo tới: Toàn bộ cư dân, Theo khu trọ, Theo phòng, hoặc Đích danh khách thuê.
11. **Báo cáo & Thống kê (`/admin/reports`)**:
    - Báo cáo tài chính, công nợ, tỷ lệ lấp đầy toàn hệ thống.

---

### 👤 Khách thuê (USER / TENANT)
1. **Cổng cư dân (`/dashboard`)**:
   - Xem phòng hiện tại (số phòng, tòa nhà, giá thuê, tiền cọc, ngày vào ở).
   - Xem thông tin hợp đồng đang hiệu lực.
   - Xem hóa đơn kỳ gần nhất cần thanh toán (tiền phòng, điện, nước, dịch vụ).
   - Nhận thông báo mới từ Ban Quản Lý, đánh dấu đã đọc.
2. **Hóa đơn cá nhân (`/invoices`)**:
   - Chỉ xem hóa đơn của chính mình (chống rò rỉ IDOR).
   - Xem bản kê chi tiết từng khoản mục tiền điện, nước, dịch vụ, nợ cũ.
3. **Lịch sử thanh toán (`/payments`)**:
   - Tra cứu ngày nộp, phương thức nộp, số tiền đã đóng cho BQL.
4. **Hợp đồng thuê (`/contract`)**:
   - Xem toàn văn điều khoản hợp đồng đã ký kết (chế độ chỉ đọc).
5. **Hồ sơ cá nhân (`/profile`)**:
   - Cập nhật Họ tên, Số điện thoại liên lạc.
   - Đổi mật khẩu tài khoản.
   - Các trường nhạy cảm (Vai trò, Phòng, Tiền thuê, Hợp đồng) được khóa chặt.

---

## 4. Hướng dẫn cài đặt & Khởi chạy (Getting Started)

### Bước 1: Cấu hình biến môi trường
File `.env` đã được cấu hình kết nối tới PostgreSQL cục bộ:
```env
DATABASE_URL="postgresql://postgres:1234@localhost:5432/tromanage?schema=public"
JWT_SECRET="tromanage_super_secret_jwt_key_2026_production_safe_string_12345"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Bước 2: Đồng bộ cấu trúc Database
Chạy lệnh đồng bộ 12 entities và indexes vào cơ sở dữ liệu:
```bash
npm run db:push
```

### Bước 3: Nạp dữ liệu mẫu ban đầu (Seed data)
```bash
npm run db:seed
```
*Lệnh này sẽ khởi tạo 1 tài khoản Admin, 3 tài khoản khách thuê, 2 khu trọ, 12 phòng trọ, các hợp đồng đang hoạt động, bảng ghi điện nước, hóa đơn, thanh toán và thông báo.*

### Bước 4: Chạy kiểm thử tự động (Automated Tests)
```bash
npm test
```
*Kiểm tra 25 ca kiểm thử logic tính toán tiền điện nước, hóa đơn, mã hóa mật khẩu, phân quyền RBAC và chống lỗ hổng IDOR.*

### Bước 5: Khởi động máy chủ phát triển (Development)
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000`

### Bước 6: Đóng gói và chạy Production
```bash
npm run build
npm start
```
Truy cập cổng ứng dụng production tại `http://localhost:3000`.

---

## 5. Hướng dẫn tạo thêm tài khoản đăng nhập (User / Admin)

### Cách 1: Thêm khách thuê mới trực tiếp trên Giao diện Web (Khuyên dùng)
1. Đăng nhập bằng tài khoản Quản trị: `admin@nhatro.local` / `Admin123!`
2. Vào mục **Người thuê** (`/admin/tenants`) ➔ Nhấn nút **"+ Thêm người thuê"**.
3. Nhập Họ tên, Email (ví dụ: `hoang.nam@gmail.com`), Số điện thoại, CCCD và chọn phòng thuê.
4. Nhấn **"Tạo khách thuê"**.
5. 👉 **Hệ thống tự động cấp tài khoản đăng nhập**:
   - **Tài khoản**: `hoang.nam@gmail.com`
   - **Mật khẩu mặc định**: `User123!`
   - Khách thuê đăng nhập tại `http://localhost:3000/login` và có thể tự đổi mật khẩu trong mục **Hồ sơ cá nhân** (`/profile`).

### Cách 2: Tạo nhanh tài khoản qua Dòng lệnh (CLI Script)
Hệ thống có sẵn script tiện ích để bạn tạo bất kỳ tài khoản nào chỉ với 1 dòng lệnh:

- **Tạo thêm khách thuê (USER)**:
  ```bash
  npx tsx scripts/create-user.ts tenant2@gmail.com User123! "Nguyễn Thị Mai" USER 0912345678
  ```
- **Tạo thêm quản trị viên (ADMIN)**:
  ```bash
  npx tsx scripts/create-user.ts admin2@nhatro.local Admin123! "Quản Lý Phụ" ADMIN 0909999999
  ```

---

## 6. Cấu trúc thư mục dự án

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/                  # Đăng nhập & Quick Demo Credentials
│   │   └── forgot-password/        # Quên mật khẩu
│   ├── (tenant)/                   # Tenant Portal (Role: USER)
│   │   ├── dashboard/              # Tổng quan phòng, hợp đồng, hóa đơn
│   │   ├── invoices/               # Danh sách hóa đơn cá nhân
│   │   ├── payments/               # Lịch sử nộp tiền
│   │   ├── contract/               # Văn bản hợp đồng thuê
│   │   └── profile/                # Cập nhật hồ sơ & đổi mật khẩu
│   ├── admin/                      # Admin Portal (Role: ADMIN)
│   │   ├── dashboard/              # Dashboard thống kê & biểu đồ Recharts
│   │   ├── properties/             # Quản lý khu trọ
│   │   ├── rooms/                  # Quản lý phòng trọ
│   │   ├── tenants/                # Quản lý người thuê & CCCD
│   │   ├── contracts/              # Quản lý hợp đồng & thanh lý
│   │   ├── utilities/              # Ghi chỉ số điện nước & lịch sử
│   │   ├── services/               # Dịch vụ gia tăng (Wifi, Xe, Rác...)
│   │   ├── invoices/               # Lập hóa đơn, phát hành hàng loạt
│   │   ├── payments/               # Ghi nhận thanh toán hóa đơn
│   │   ├── notifications/          # Gửi thông báo theo đối tượng
│   │   ├── reports/                # Báo cáo dòng tiền & tỷ lệ lấp đầy
│   │   └── settings/               # Cài đặt admin
│   ├── api/                        # RESTful API Endpoints
│   │   ├── auth/
│   │   ├── properties/
│   │   ├── rooms/
│   │   ├── tenants/
│   │   ├── contracts/
│   │   ├── utilities/
│   │   ├── services/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── notifications/
│   │   └── tenant/
│   ├── layout.tsx
│   └── page.tsx                    # Điều hướng thông minh theo role
├── components/
│   ├── ui/                         # StatusBadge, StatCard, PageHeader, FormModal, ConfirmDialog, etc.
│   └── layouts/                    # AdminSidebar, AdminNavbar, TenantNavbar
├── lib/
│   ├── auth/                       # JWT, Cookies, Session, RBAC helpers
│   ├── db/                         # Prisma Client singleton
│   ├── utils/                      # Formatting VNĐ, tính tiền điện nước, tính tổng hóa đơn
│   └── api-response.ts             # Standardized API response
prisma/
├── schema.prisma                   # 12 Entities cơ sở dữ liệu quan hệ
└── seed.ts                         # Dữ liệu khởi tạo chuẩn
tests/
└── business-logic.test.ts          # Bộ kiểm thử tự động 25 tiêu chí
```
