import bcrypt from "bcrypt";
import { PrismaClient, UserRole, VehicleStatus } from "@prisma/client";

const prisma = new PrismaClient();

const routes = [
  {
    name: "KBS-01",
    origin: "Westlands",
    destination: "CBD",
    distanceKm: 8.4,
    stages: [
      { name: "Westlands", latitude: -1.2674, longitude: 36.8065 },
      { name: "Museum Hill", latitude: -1.2745, longitude: 36.8157 },
      { name: "Kencom", latitude: -1.2864, longitude: 36.8267 }
    ]
  },
  {
    name: "KBS-03",
    origin: "Karen",
    destination: "CBD",
    distanceKm: 16.8,
    stages: [
      { name: "Karen", latitude: -1.3192, longitude: 36.7073 },
      { name: "Langata", latitude: -1.3312, longitude: 36.7812 },
      { name: "Railways", latitude: -1.2921, longitude: 36.8276 }
    ]
  },
  {
    name: "KBS-05",
    origin: "Thika",
    destination: "CBD",
    distanceKm: 44.2,
    stages: [
      { name: "Thika", latitude: -1.0333, longitude: 37.0693 },
      { name: "Ruiru", latitude: -1.1466, longitude: 36.9613 },
      { name: "CBD", latitude: -1.2864, longitude: 36.8172 }
    ]
  }
];

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("Admin@12345", 12);
  const marshalPasswordHash = await bcrypt.hash("Marshal@12345", 12);
  const driverPasswordHash = await bcrypt.hash("Driver@12345", 12);

  await prisma.user.upsert({
    where: { email: "admin@na-flow.local" },
    update: {},
    create: {
      name: "John Kamau",
      email: "admin@na-flow.local",
      phone: "+254700000001",
      passwordHash,
      passwordChangeAllowed: true,
      role: UserRole.SUPER_ADMIN
    }
  });

  await prisma.user.upsert({
    where: { email: "marshal@na-flow.local" },
    update: {
      name: "Samuel Njoroge",
      passwordHash: marshalPasswordHash,
      passwordChangeAllowed: true,
      role: UserRole.FLEET_MARSHAL
    },
    create: {
      name: "Samuel Njoroge",
      email: "marshal@na-flow.local",
      phone: "+254700000002",
      passwordHash: marshalPasswordHash,
      passwordChangeAllowed: true,
      role: UserRole.FLEET_MARSHAL
    }
  });

  const createdRoutes = [];
  for (const route of routes) {
    createdRoutes.push(
      await prisma.route.upsert({
        where: { name: route.name },
        update: route,
        create: route
      })
    );
  }
  const primaryRoute = createdRoutes[0];
  if (!primaryRoute) {
    throw new Error("Seed requires at least one route");
  }

  const demoDriverUser = await prisma.user.upsert({
    where: { email: "driver@na-flow.local" },
    update: {
      name: "James Mwangi",
      passwordHash: driverPasswordHash,
      passwordChangeAllowed: false,
      role: UserRole.DRIVER,
      assignedRouteId: primaryRoute.id
    },
    create: {
      name: "James Mwangi",
      email: "driver@na-flow.local",
      phone: "+254700000003",
      passwordHash: driverPasswordHash,
      passwordChangeAllowed: false,
      role: UserRole.DRIVER,
      assignedRouteId: primaryRoute.id
    }
  });

  await prisma.driver.upsert({
    where: { userId: demoDriverUser.id },
    update: {},
    create: {
      userId: demoDriverUser.id,
      licenseNumber: "DL-2018-45678",
      licenseExpiry: new Date("2028-12-31T00:00:00.000Z"),
      safetyScore: 98,
      mpesaPhone: "+254700000003"
    }
  });

  for (let index = 1; index <= 10; index += 1) {
    const phone = `+2547110000${index.toString().padStart(2, "0")}`;
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        name: `Driver ${index}`,
        email: `driver${index}@na-flow.local`,
        phone,
        passwordHash: driverPasswordHash,
        passwordChangeAllowed: false,
        role: UserRole.DRIVER
      }
    });

    await prisma.driver.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        licenseNumber: `DL-${index.toString().padStart(5, "0")}`,
        licenseExpiry: new Date("2028-12-31T00:00:00.000Z"),
        safetyScore: 90 + (index % 9),
        mpesaPhone: phone
      }
    });
  }

  for (let index = 1; index <= 52; index += 1) {
    const route = createdRoutes[(index - 1) % createdRoutes.length];
    await prisma.vehicle.upsert({
      where: { id: `KBX ${index.toString().padStart(3, "0")}A` },
      update: {},
      create: {
        id: `KBX ${index.toString().padStart(3, "0")}A`,
        nickname: `Na-Flow ${index}`,
        capacity: 33,
        year: 2018 + (index % 6),
        makeModel: "Isuzu NQR",
        assignedRouteId: route.id,
        status: index % 13 === 0 ? VehicleStatus.MAINTENANCE : index % 7 === 0 ? VehicleStatus.OFFLINE : VehicleStatus.ACTIVE,
        odometer: 40000 + index * 913
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
