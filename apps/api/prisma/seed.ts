import bcrypt from "bcrypt";
import { PrismaClient, UserRole, VehicleStatus } from "@prisma/client";

const prisma = new PrismaClient();

const routes = [
  { name: "Zimmerman", origin: "Zimmerman", destination: "CBD", distanceKm: 14.2 },
  { name: "Kasarani", origin: "Kasarani", destination: "CBD", distanceKm: 16.4 },
  { name: "Githurai", origin: "Githurai", destination: "CBD", distanceKm: 21.8 },
  { name: "Juja", origin: "Juja", destination: "CBD", distanceKm: 34.7 },
  { name: "Thika", origin: "Thika", destination: "CBD", distanceKm: 44.2 },
  { name: "Ngong", origin: "Ngong", destination: "CBD", distanceKm: 22.5 },
  { name: "Roysambu", origin: "Roysambu", destination: "CBD", distanceKm: 13.6 },
  { name: "Mombasa Road", origin: "Mombasa Road", destination: "CBD", distanceKm: 18.9 },
  { name: "Kikuyu", origin: "Kikuyu", destination: "CBD", distanceKm: 24.1 }
];

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("Admin@12345", 12);
  const marshalPasswordHash = await bcrypt.hash("Marshal@12345", 12);
  const driverPasswordHash = await bcrypt.hash("Driver@12345", 12);
  const conductorPasswordHash = await bcrypt.hash("Conductor@12345", 12);

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
        update: { ...route, stages: [{ name: route.origin }, { name: route.destination }] },
        create: { ...route, stages: [{ name: route.origin }, { name: route.destination }] }
      })
    );
  }
  const primaryRoute = createdRoutes[0];
  if (!primaryRoute) {
    throw new Error("Seed requires at least one route");
  }

  await prisma.user.update({
    where: { email: "marshal@na-flow.local" },
    data: { assignedRouteId: primaryRoute.id }
  });

  const demoDriverUser = await prisma.user.upsert({
    where: { email: "driver@na-flow.local" },
    update: {
      name: "James Mwangi",
      passwordHash: driverPasswordHash,
      passwordChangeAllowed: false,
      role: UserRole.DRIVER,
      assignedRouteId: primaryRoute.id,
      assignedVehicleId: "KBZ-482D"
    },
    create: {
      name: "James Mwangi",
      email: "driver@na-flow.local",
      phone: "+254700000003",
      passwordHash: driverPasswordHash,
      passwordChangeAllowed: false,
      role: UserRole.DRIVER,
      assignedRouteId: primaryRoute.id,
      assignedVehicleId: "KBZ-482D"
    }
  });

  const demoDriverProfile = await prisma.driver.upsert({
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

  await prisma.user.upsert({
    where: { email: "conductor@na-flow.local" },
    update: {
      name: "Mary Wairimu",
      passwordHash: conductorPasswordHash,
      passwordChangeAllowed: false,
      role: UserRole.CONDUCTOR,
      assignedRouteId: primaryRoute.id,
      assignedVehicleId: "KBZ-482D"
    },
    create: {
      name: "Mary Wairimu",
      email: "conductor@na-flow.local",
      phone: "+254700000004",
      passwordHash: conductorPasswordHash,
      passwordChangeAllowed: false,
      role: UserRole.CONDUCTOR,
      assignedRouteId: primaryRoute.id,
      assignedVehicleId: "KBZ-482D"
    }
  });

  await prisma.vehicle.upsert({
    where: { id: "KBZ-482D" },
    update: {
      assignedRouteId: primaryRoute.id,
      currentDriverId: demoDriverProfile.id
    },
    create: {
      id: "KBZ-482D",
      nickname: "Thunder",
      capacity: 33,
      year: 2021,
      makeModel: "Isuzu NQR",
      assignedRouteId: primaryRoute.id,
      currentDriverId: demoDriverProfile.id,
      status: VehicleStatus.ACTIVE,
      odometer: 58240
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
