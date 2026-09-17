import {
  PrismaClient,
  Role,
  RoomStatus,
  ContractStatus,
  ServiceCalculationType,
  InvoiceStatus,
  PaymentMethod,
  NotificationTargetType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Clear existing data in reverse order of foreign keys
  await prisma.notificationRead.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.roomService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.utilityReading.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.room.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  console.log("Old data cleared.");

  // Password hashes
  const adminPassword = bcrypt.hashSync("Admin123!", 10);
  const userPassword = bcrypt.hashSync("User123!", 10);

  // 1. Users
  const adminUser = await prisma.user.create({
    data: {
      fullName: "Nguyễn Văn Quản Trị",
      email: "admin@nhatro.local",
      phone: "0901234567",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    },
  });

  const tenantUser1 = await prisma.user.create({
    data: {
      fullName: "Lê Văn Cường",
      email: "user@nhatro.local",
      phone: "0987654321",
      passwordHash: userPassword,
      role: Role.USER,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=cuong",
    },
  });

  const tenantUser2 = await prisma.user.create({
    data: {
      fullName: "Trần Thị Hương",
      email: "huong.tran@nhatro.local",
      phone: "0912345678",
      passwordHash: userPassword,
      role: Role.USER,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=huong",
    },
  });

  const tenantUser3 = await prisma.user.create({
    data: {
      fullName: "Phạm Minh Hoàng",
      email: "hoang.pham@nhatro.local",
      phone: "0933445566",
      passwordHash: userPassword,
      role: Role.USER,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=hoang",
    },
  });

  console.log("Users created.");

  // 2. Properties
  const prop1 = await prisma.property.create({
    data: {
      name: "Khu Trọ An Cư - Bình Thạnh",
      address: "123 Đường Bạch Đằng, Phường 15, Quận Bình Thạnh, TP.HCM",
      description: "Nhà trọ cao cấp, giờ giấc tự do, bảo vệ 24/7, có thang máy và hầm xe.",
      electricPrice: 3500,
      waterPrice: 25000,
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      name: "Khu Trọ Hưng Thịnh - Cầu Giấy",
      address: "45 Ngõ 165 Cầu Giấy, Quận Cầu Giấy, Hà Nội",
      description: "Khu trọ yên tĩnh, gần trường đại học, đầy đủ tiện nghi máy lạnh, nóng lạnh.",
      electricPrice: 3800,
      waterPrice: 28000,
    },
  });

  console.log("Properties created.");

  // 3. Services (some property-specific, some global)
  const serviceWifiP1 = await prisma.service.create({
    data: {
      propertyId: prop1.id,
      name: "Internet Cáp Quang Bình Thạnh",
      price: 100000,
      calculationType: ServiceCalculationType.PER_ROOM,
      description: "Đường truyền cáp quang riêng tốc độ cao 150Mbps mỗi phòng",
    },
  });

  const serviceWifiP2 = await prisma.service.create({
    data: {
      propertyId: prop2.id,
      name: "Internet Cáp Quang Cầu Giấy",
      price: 80000,
      calculationType: ServiceCalculationType.PER_ROOM,
      description: "Đường truyền cáp quang tốc độ cao 100Mbps",
    },
  });

  const serviceTrash = await prisma.service.create({
    data: {
      propertyId: null, // Dịch vụ dùng chung
      name: "Rác & Vệ sinh hành lang",
      price: 50000,
      calculationType: ServiceCalculationType.PER_ROOM,
      description: "Phí thu gom rác hằng ngày và quét dọn khu vực chung",
    },
  });

  const serviceBikeP1 = await prisma.service.create({
    data: {
      propertyId: prop1.id,
      name: "Gửi xe máy ban đêm (Bình Thạnh)",
      price: 120000,
      calculationType: ServiceCalculationType.QUANTITY,
      description: "Chỗ giữ xe trong hầm có camera giám sát và quẹt thẻ từ",
    },
  });

  const serviceBikeP2 = await prisma.service.create({
    data: {
      propertyId: prop2.id,
      name: "Gửi xe máy ban đêm (Cầu Giấy)",
      price: 100000,
      calculationType: ServiceCalculationType.QUANTITY,
      description: "Chỗ giữ xe trong sân có mái che và camera giám sát",
    },
  });

  const serviceMgmt = await prisma.service.create({
    data: {
      propertyId: prop1.id,
      name: "Phí quản lý & Thang máy",
      price: 80000,
      calculationType: ServiceCalculationType.PER_PERSON,
      description: "Bảo trì thang máy, camera an ninh, đèn chiếu sáng lối đi chung",
    },
  });

  console.log("Services created.");

  // 4. 12 Rooms (6 in Prop 1, 6 in Prop 2)
  // Prop 1 rooms
  const p1Rooms = [];
  for (let floor = 1; floor <= 2; floor++) {
    for (let i = 1; i <= 3; i++) {
      const roomNum = `${floor}0${i}`;
      let status: RoomStatus = RoomStatus.AVAILABLE;
      if (roomNum === "101") status = RoomStatus.OCCUPIED;
      if (roomNum === "102") status = RoomStatus.OCCUPIED;
      if (roomNum === "203") status = RoomStatus.MAINTENANCE;

      const r = await prisma.room.create({
        data: {
          propertyId: prop1.id,
          roomNumber: `P.${roomNum}`,
          floor: floor,
          area: 25 + (i - 1) * 3,
          rentPrice: 3500000 + (floor - 1) * 200000 + (i - 1) * 100000,
          electricPrice: prop1.electricPrice,
          waterPrice: prop1.waterPrice,
          deposit: 3500000,
          maxOccupants: 3,
          status: status,
          note: status === RoomStatus.MAINTENANCE ? "Đang sửa chữa máy lạnh và sơn tường" : "Phòng thoáng mát có ban công",
        },
      });
      p1Rooms.push(r);
    }
  }

  // Prop 2 rooms
  const p2Rooms = [];
  for (let floor = 1; floor <= 2; floor++) {
    for (let i = 1; i <= 3; i++) {
      const roomNum = `${floor}0${i}`;
      let status: RoomStatus = RoomStatus.AVAILABLE;
      if (roomNum === "101") status = RoomStatus.OCCUPIED;

      const r = await prisma.room.create({
        data: {
          propertyId: prop2.id,
          roomNumber: `P.${roomNum}`,
          floor: floor,
          area: 22 + (i - 1) * 4,
          rentPrice: 3200000 + (floor - 1) * 150000 + (i - 1) * 100000,
          electricPrice: prop2.electricPrice,
          waterPrice: prop2.waterPrice,
          deposit: 3200000,
          maxOccupants: 2,
          status: status,
          note: "Đầy đủ giường nệm và điều hòa Inverter",
        },
      });
      p2Rooms.push(r);
    }
  }

  console.log("12 Rooms created.");

  // Target rooms for active tenants:
  const roomOccupied1 = p1Rooms[0]; // P.101 Prop 1
  const roomOccupied2 = p1Rooms[1]; // P.102 Prop 1
  const roomOccupied3 = p2Rooms[0]; // P.101 Prop 2

  // Assign Services to Rooms
  for (const r of p1Rooms) {
    await prisma.roomService.create({
      data: {
        roomId: r.id,
        serviceId: serviceWifiP1.id,
        quantity: 1,
      },
    });
    await prisma.roomService.create({
      data: {
        roomId: r.id,
        serviceId: serviceTrash.id,
        quantity: 1,
      },
    });
    if (r.status === RoomStatus.OCCUPIED) {
      await prisma.roomService.create({
        data: {
          roomId: r.id,
          serviceId: serviceBikeP1.id,
          quantity: 2,
        },
      });
      await prisma.roomService.create({
        data: {
          roomId: r.id,
          serviceId: serviceMgmt.id,
          quantity: 2,
        },
      });
    }
  }

  for (const r of p2Rooms) {
    await prisma.roomService.create({
      data: {
        roomId: r.id,
        serviceId: serviceWifiP2.id,
        quantity: 1,
      },
    });
    await prisma.roomService.create({
      data: {
        roomId: r.id,
        serviceId: serviceTrash.id,
        quantity: 1,
      },
    });
    if (r.status === RoomStatus.OCCUPIED) {
      await prisma.roomService.create({
        data: {
          roomId: r.id,
          serviceId: serviceBikeP2.id,
          quantity: 2,
        },
      });
    }
  }

  // 5. Tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      userId: tenantUser1.id,
      roomId: roomOccupied1.id,
      idNumber: "079095012345",
      birthday: new Date("1998-05-15"),
      gender: "Nam",
      permanentAddress: "Xã Hòa Phú, Huyện Củ Chi, TP.HCM",
      startDate: new Date("2026-01-01"),
      status: "ACTIVE",
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      userId: tenantUser2.id,
      roomId: roomOccupied2.id,
      idNumber: "038196014567",
      birthday: new Date("1996-10-20"),
      gender: "Nữ",
      permanentAddress: "Phường Thủy Xuân, TP.Huế, Thừa Thiên Huế",
      startDate: new Date("2026-02-01"),
      status: "ACTIVE",
    },
  });

  const tenant3 = await prisma.tenant.create({
    data: {
      userId: tenantUser3.id,
      roomId: roomOccupied3.id,
      idNumber: "001201019876",
      birthday: new Date("2001-08-08"),
      gender: "Nam",
      permanentAddress: "Thị trấn Như Quỳnh, Huyện Văn Lâm, Hưng Yên",
      startDate: new Date("2026-03-01"),
      status: "ACTIVE",
    },
  });

  console.log("3 Tenants created.");

  // 6. Contracts
  const contract1 = await prisma.contract.create({
    data: {
      tenantId: tenant1.id,
      roomId: roomOccupied1.id,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2027-01-01"),
      rentPrice: roomOccupied1.rentPrice,
      deposit: roomOccupied1.deposit,
      paymentCycle: 1,
      terms: "Hợp đồng thuê 12 tháng. Thanh toán tiền phòng từ ngày 01 đến ngày 05 hàng tháng. Giữ gìn trật tự và vệ sinh chung.",
      status: ContractStatus.ACTIVE,
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      tenantId: tenant2.id,
      roomId: roomOccupied2.id,
      startDate: new Date("2026-02-01"),
      endDate: new Date("2027-02-01"),
      rentPrice: roomOccupied2.rentPrice,
      deposit: roomOccupied2.deposit,
      paymentCycle: 1,
      terms: "Hợp đồng thuê phòng dài hạn 1 năm. Báo trước 30 ngày khi có ý định kết thúc hợp đồng.",
      status: ContractStatus.ACTIVE,
    },
  });

  const contract3 = await prisma.contract.create({
    data: {
      tenantId: tenant3.id,
      roomId: roomOccupied3.id,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-09-01"),
      rentPrice: roomOccupied3.rentPrice,
      deposit: roomOccupied3.deposit,
      paymentCycle: 1,
      terms: "Hợp đồng thuê 6 tháng. Không nuôi thú cưng gây ồn ào.",
      status: ContractStatus.ACTIVE,
    },
  });

  console.log("3 Contracts created.");

  // 7. Utility Readings
  const currentMonth = "2026-09";
  const prevMonth = "2026-08";

  // Readings for tenant1 room
  await prisma.utilityReading.create({
    data: {
      roomId: roomOccupied1.id,
      month: prevMonth,
      electricOld: 120,
      electricNew: 195, // 75 kWh
      waterOld: 40,
      waterNew: 48, // 8 m3
    },
  });

  await prisma.utilityReading.create({
    data: {
      roomId: roomOccupied1.id,
      month: currentMonth,
      electricOld: 195,
      electricNew: 280, // 85 kWh
      waterOld: 48,
      waterNew: 57, // 9 m3
    },
  });

  // Readings for tenant2 room
  await prisma.utilityReading.create({
    data: {
      roomId: roomOccupied2.id,
      month: currentMonth,
      electricOld: 310,
      electricNew: 405, // 95 kWh
      waterOld: 60,
      waterNew: 70, // 10 m3
    },
  });

  // Readings for tenant3 room
  await prisma.utilityReading.create({
    data: {
      roomId: roomOccupied3.id,
      month: currentMonth,
      electricOld: 50,
      electricNew: 110, // 60 kWh
      waterOld: 15,
      waterNew: 21, // 6 m3
    },
  });

  console.log("Utility readings created.");

  // 8. Invoices & Payments
  // Invoice 1: Tenant 1 - Month 08 (PAID)
  const inv1Electric = (195 - 120) * roomOccupied1.electricPrice; // 75 * 3500 = 262,500
  const inv1Water = (48 - 40) * roomOccupied1.waterPrice; // 8 * 25000 = 200,000
  const inv1Service = 100000 + 50000 + 240000; // wifi + trash + 2 bikes = 390,000
  const inv1Total = roomOccupied1.rentPrice + inv1Electric + inv1Water + inv1Service;

  const inv1 = await prisma.invoice.create({
    data: {
      tenantId: tenant1.id,
      roomId: roomOccupied1.id,
      month: prevMonth,
      roomFee: roomOccupied1.rentPrice,
      electricFee: inv1Electric,
      waterFee: inv1Water,
      serviceFee: inv1Service,
      otherFee: 0,
      previousDebt: 0,
      discount: 0,
      total: inv1Total,
      dueDate: new Date("2026-08-05"),
      status: InvoiceStatus.PAID,
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      amount: inv1Total,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentDate: new Date("2026-08-04"),
      note: "Chuyển khoản Vietcombank",
    },
  });

  // Invoice 2: Tenant 1 - Current Month (UNPAID)
  const inv2Electric = (280 - 195) * roomOccupied1.electricPrice; // 85 * 3500 = 297,500
  const inv2Water = (57 - 48) * roomOccupied1.waterPrice; // 9 * 25000 = 225,000
  const inv2Total = roomOccupied1.rentPrice + inv2Electric + inv2Water + inv1Service;

  await prisma.invoice.create({
    data: {
      tenantId: tenant1.id,
      roomId: roomOccupied1.id,
      month: currentMonth,
      roomFee: roomOccupied1.rentPrice,
      electricFee: inv2Electric,
      waterFee: inv2Water,
      serviceFee: inv1Service,
      otherFee: 0,
      previousDebt: 0,
      discount: 0,
      total: inv2Total,
      dueDate: new Date("2026-09-20"),
      status: InvoiceStatus.UNPAID,
    },
  });

  // Invoice 3: Tenant 2 - Current Month (OVERDUE demo)
  const inv3Electric = 95 * roomOccupied2.electricPrice;
  const inv3Water = 10 * roomOccupied2.waterPrice;
  const inv3Service = 100000 + 50000 + 120000;
  const inv3Total = roomOccupied2.rentPrice + inv3Electric + inv3Water + inv3Service;

  await prisma.invoice.create({
    data: {
      tenantId: tenant2.id,
      roomId: roomOccupied2.id,
      month: "2026-08",
      roomFee: roomOccupied2.rentPrice,
      electricFee: inv3Electric,
      waterFee: inv3Water,
      serviceFee: inv3Service,
      otherFee: 50000, // Phạt trễ hạn
      previousDebt: 0,
      discount: 0,
      total: inv3Total + 50000,
      dueDate: new Date("2026-08-10"),
      status: InvoiceStatus.OVERDUE,
    },
  });

  // Invoice 4: Tenant 3 - Current Month (PAID)
  const inv4Electric = 60 * roomOccupied3.electricPrice;
  const inv4Water = 6 * roomOccupied3.waterPrice;
  const inv4Service = 100000 + 50000;
  const inv4Total = roomOccupied3.rentPrice + inv4Electric + inv4Water + inv4Service;

  const inv4 = await prisma.invoice.create({
    data: {
      tenantId: tenant3.id,
      roomId: roomOccupied3.id,
      month: currentMonth,
      roomFee: roomOccupied3.rentPrice,
      electricFee: inv4Electric,
      waterFee: inv4Water,
      serviceFee: inv4Service,
      otherFee: 0,
      previousDebt: 0,
      discount: 0,
      total: inv4Total,
      dueDate: new Date("2026-09-25"),
      status: InvoiceStatus.PAID,
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv4.id,
      amount: inv4Total,
      paymentMethod: PaymentMethod.CASH,
      paymentDate: new Date("2026-09-10"),
      note: "Nộp tiền mặt trực tiếp cho ban quản lý",
    },
  });

  console.log("Invoices and Payments created.");

  // 9. Notifications
  const notif1 = await prisma.notification.create({
    data: {
      title: "Thông báo lịch bảo trì hệ thống cấp nước",
      content: "Ban quản lý sẽ tiến hành súc rửa bể chứa nước sinh hoạt từ 13h00 đến 16h00 thứ Bảy tuần này. Kính mong quý cư dân chủ động tích trữ nước sinh hoạt.",
      targetType: NotificationTargetType.ALL,
    },
  });

  const notif2 = await prisma.notification.create({
    data: {
      title: "Thông báo nhắc hạn đóng tiền phòng tháng 09/2026",
      content: "Hóa đơn tiền phòng tháng 09/2026 đã được phát hành. Quý cư dân vui lòng kiểm tra mục Hóa đơn và thanh toán trước ngày 20/09/2026.",
      targetType: NotificationTargetType.PROPERTY,
      targetId: prop1.id,
    },
  });

  const notif3 = await prisma.notification.create({
    data: {
      title: "Chào mừng quý khách đến với Khu trọ An Cư",
      content: "Chúc mừng bạn đã hoàn tất hợp đồng thuê phòng P.101. Mọi thắc mắc và yêu cầu hỗ trợ xin liên hệ hotline ban quản lý.",
      targetType: NotificationTargetType.USER,
      targetId: tenantUser1.id,
    },
  });

  // Mark notif1 as read for tenantUser1
  await prisma.notificationRead.create({
    data: {
      notificationId: notif1.id,
      userId: tenantUser1.id,
    },
  });

  console.log("Notifications created.");
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
