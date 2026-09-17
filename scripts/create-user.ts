import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments:
  // npx tsx scripts/create-user.ts <email> <password> <fullName> [role: ADMIN|USER] [phone]
  const email = args[0];
  const password = args[1];
  const fullName = args[2] || "Người Dùng Mới";
  const roleInput = (args[3] || "USER").toUpperCase();
  const phone = args[4] || null;

  if (!email || !password) {
    console.log(`
===============================================================
🔧 HƯỚNG DẪN SỬ DỤNG SCRIPT TẠO TÀI KHOẢN:
===============================================================
Cú pháp:
  npx tsx scripts/create-user.ts <email> <mật_khẩu> [họ_tên] [vai_trò: ADMIN|USER] [sđt]

Ví dụ 1: Tạo tài khoản Khách thuê (USER)
  npx tsx scripts/create-user.ts tenant2@gmail.com User123! "Nguyễn Thị Mai" USER 0912345678

Ví dụ 2: Tạo thêm tài khoản Quản trị viên (ADMIN)
  npx tsx scripts/create-user.ts admin2@nhatro.local Admin123! "Quản Lý 2" ADMIN 0909999999
===============================================================
    `);
    process.exit(1);
  }

  const role: Role = roleInput === "ADMIN" ? Role.ADMIN : Role.USER;

  // Check existing user
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existing) {
    console.error(`❌ Lỗi: Email "${email}" đã tồn tại trong hệ thống (ID: ${existing.id}).`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName: fullName.trim(),
      phone: phone?.trim() || null,
      role,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
    },
  });

  // If role is USER, also create an initial Tenant record so they can log into the Tenant Portal
  if (role === Role.USER) {
    await prisma.tenant.create({
      data: {
        userId: newUser.id,
        startDate: new Date(),
        status: "ACTIVE",
        gender: "Nam",
      },
    });
  }

  console.log(`
✅ TẠO TÀI KHOẢN THÀNH CÔNG!
---------------------------------------------
- ID: ${newUser.id}
- Họ và tên: ${newUser.fullName}
- Email: ${newUser.email}
- Mật khẩu: ${password}
- Quyền hạn (Role): ${newUser.role}
- SĐT: ${newUser.phone || "(Chưa có)"}
---------------------------------------------
Bây giờ bạn có thể dùng tài khoản này để đăng nhập tại:
👉 http://localhost:3000/login
  `);
}

main()
  .catch((e) => {
    console.error("Lỗi khi tạo tài khoản:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
