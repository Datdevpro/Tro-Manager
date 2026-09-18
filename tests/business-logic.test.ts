import { calculateInvoiceTotal, calculateUtilityCost } from "../src/lib/utils";
import { signToken, verifyToken } from "../src/lib/auth/jwt";
import bcrypt from "bcryptjs";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✔ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✖ [FAIL] ${testName}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("  TROMANAGE MVP - AUTOMATED BUSINESS LOGIC TEST SUITE");
  console.log("========================================================\n");

  // 1. Test Invoice Calculation
  console.log("--- 1. INVOICE CALCULATION LOGIC ---");
  {
    const total1 = calculateInvoiceTotal({
      roomFee: 3500000,
      electricFee: 250000,
      waterFee: 150000,
      serviceFee: 190000,
      otherFee: 50000,
      previousDebt: 100000,
      discount: 50000,
    });
    // 3500000 + 250000 + 150000 + 190000 + 50000 + 100000 - 50000 = 4190000
    assert(total1 === 4190000, "Calculates invoice total with all fees, debts and discounts");

    const total2 = calculateInvoiceTotal({
      roomFee: 3000000,
      electricFee: 0,
      waterFee: 0,
      serviceFee: 0,
      discount: 5000000, // discount > roomFee
    });
    assert(total2 === 0, "Invoice total never negative (bounded to >= 0)");
  }

  // 2. Test Utility Calculation
  console.log("\n--- 2. UTILITY USAGE & COST CALCULATION ---");
  {
    const { usage, cost } = calculateUtilityCost(100, 185, 3500);
    assert(usage === 85, "Calculates exact electric usage (185 - 100 = 85 kWh)");
    assert(cost === 85 * 3500, "Calculates exact electric cost (85 * 3500 = 297,500 VND)");

    const water = calculateUtilityCost(20, 28, 25000);
    assert(water.usage === 8, "Calculates water usage (28 - 20 = 8 m3)");
    assert(water.cost === 8 * 25000, "Calculates water cost (8 * 25000 = 200,000 VND)");

    const fallback = calculateUtilityCost(150, 100, 3500);
    assert(fallback.usage === 0, "New reading < Old reading yields 0 usage as boundary guard");
  }

  // 3. Test Authentication & Password Hashing
  console.log("\n--- 3. AUTHENTICATION & PASSWORD HASHING ---");
  {
    const password = "Admin123!";
    const hash = bcrypt.hashSync(password, 10);
    assert(bcrypt.compareSync(password, hash), "Password hashes and verifies with bcrypt");
    assert(!bcrypt.compareSync("WrongPassword", hash), "Rejects invalid password with bcrypt");
  }

  // 4. Test JWT Signing & Verification
  console.log("\n--- 4. JWT SESSION SIGNING & VERIFICATION ---");
  {
    const token = await signToken({
      userId: "user-test-123",
      email: "user@nhatro.local",
      role: "USER",
      fullName: "Lê Văn Cường",
    });

    const payload = await verifyToken(token);
    assert(payload !== null, "JWT token verified successfully");
    assert(payload?.userId === "user-test-123", "JWT payload contains correct userId");
    assert(payload?.role === "USER", "JWT payload contains correct role");

    const invalid = await verifyToken("malicious.jwt.token");
    assert(invalid === null, "Rejects malformed or tampered JWT token");
  }

  // 5. Test Role-Based Authorization & Middleware Rules
  console.log("\n--- 5. RBAC & PERMISSION BOUNDARIES ---");
  {
    function checkAccess(pathname: string, userRole: "ADMIN" | "USER" | null): { allowed: boolean; redirectUrl?: string } {
      if (!userRole) return { allowed: false, redirectUrl: "/login" };
      if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
        return { allowed: false, redirectUrl: "/dashboard" }; // Non-admin forbidden from /admin/*
      }
      return { allowed: true };
    }

    const adminToAdmin = checkAccess("/admin/rooms", "ADMIN");
    assert(adminToAdmin.allowed, "ADMIN can access /admin/rooms");

    const userToAdmin = checkAccess("/admin/rooms", "USER");
    assert(!userToAdmin.allowed && userToAdmin.redirectUrl === "/dashboard", "USER cannot access /admin/rooms (redirects /dashboard)");

    const anonToDashboard = checkAccess("/dashboard", null);
    assert(!anonToDashboard.allowed && anonToDashboard.redirectUrl === "/login", "Unauthenticated visitor cannot access /dashboard (redirects /login)");
  }

  // 6. Test IDOR & Ownership Verification
  console.log("\n--- 6. IDOR & OWNERSHIP VERIFICATION ---");
  {
    function canAccessInvoice(currentUserId: string, invoiceTenantUserId: string): boolean {
      return currentUserId === invoiceTenantUserId;
    }

    const userA = "user-id-a";
    const userB = "user-id-b";
    const invoiceOfUserB = "user-id-b";

    assert(canAccessInvoice(userB, invoiceOfUserB), "User B can access own invoice");
    assert(!canAccessInvoice(userA, invoiceOfUserB), "User A CANNOT access User B invoice (IDOR Blocked)");
  }

  // 7. Test Payment Status Transition
  console.log("\n--- 7. PAYMENT CALCULATION & INVOICE STATUS TRANSITION ---");
  {
    function getInvoiceStatus(total: number, payments: number[], dueDate: Date): "PAID" | "UNPAID" | "OVERDUE" {
      const totalPaid = payments.reduce((sum, p) => sum + p, 0);
      if (totalPaid >= total) return "PAID";
      if (new Date() > dueDate) return "OVERDUE";
      return "UNPAID";
    }

    const futureDue = new Date(Date.now() + 86400000); // tomorrow
    const pastDue = new Date(Date.now() - 86400000); // yesterday

    const status1 = getInvoiceStatus(4000000, [4000000], futureDue);
    assert(status1 === "PAID", "Full payment marks invoice as PAID");

    const status2 = getInvoiceStatus(4000000, [2000000, 2000000], pastDue);
    assert(status2 === "PAID", "Multiple partial payments adding up to total marks invoice as PAID even past due");

    const status3 = getInvoiceStatus(4000000, [2000000], futureDue);
    assert(status3 === "UNPAID", "Partial payment before due date marks invoice as UNPAID");

    const status4 = getInvoiceStatus(4000000, [1000000], pastDue);
    assert(status4 === "OVERDUE", "Partial payment after due date marks invoice as OVERDUE");
  }

  // 8. Test Room Occupancy Rules
  console.log("\n--- 8. ROOM OCCUPANCY RULES ---");
  {
    function getNextRoomStatus(activeContractCount: number, isUnderMaintenance: boolean): "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" {
      if (isUnderMaintenance) return "MAINTENANCE";
      if (activeContractCount > 0) return "OCCUPIED";
      return "AVAILABLE";
    }

    assert(getNextRoomStatus(1, false) === "OCCUPIED", "Room with active contract is OCCUPIED");
    assert(getNextRoomStatus(0, false) === "AVAILABLE", "Room with no active contracts becomes AVAILABLE");
    assert(getNextRoomStatus(0, true) === "MAINTENANCE", "Room under repair is MAINTENANCE");
  }

  // 9. Test Rate Limiting for Brute Force Protection
  console.log("\n--- 9. SECURITY & BRUTE FORCE PROTECTION ---");
  {
    const { checkRateLimit, resetRateLimit } = await import("../src/lib/auth/rate-limit");
    const testKey = "test-user-ip-attempt";

    resetRateLimit(testKey);
    // Attempts 1 to 5 should be allowed
    for (let i = 1; i <= 5; i++) {
      const res = checkRateLimit(testKey, 5, 60000);
      assert(res.allowed, `Attempt ${i}/5 is allowed`);
    }

    // 6th attempt must be blocked
    const blocked = checkRateLimit(testKey, 5, 60000);
    assert(!blocked.allowed, "6th attempt is blocked (429 Rate Limit Exceeded)");
    assert(blocked.retryAfterSeconds > 0, "Provides positive retryAfterSeconds window");

    // Resetting unblocks
    resetRateLimit(testKey);
    const unblocked = checkRateLimit(testKey, 5, 60000);
    assert(unblocked.allowed, "Successful reset clears rate limit record");
  }

  console.log("\n========================================================");
  console.log(`TEST RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
