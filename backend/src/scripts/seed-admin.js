const prisma = require("../prisma/client");

const ADMIN_EMAIL = "fehizoroandriantsarafara@gmail.com";

async function seedAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { role: "ADMIN", status: "APPROVED" },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    console.log("Admin account promoted:", updated);
  } else {
    const created = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "Admin",
        provider: "google",
        role: "ADMIN",
        status: "APPROVED",
      },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    console.log("Admin account created:", created);
  }

  await prisma.$disconnect();
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
