const { PrismaClient, OrderStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  // Create users first
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: 'hashedPassword',
      role: 'USER',
      name: 'Mock User',
    },
  });

  // Mock Order data with a valid userId
  const order = await prisma.order.create({
    data: {
      userId: user.id, // Ensure this userId exists
      productId: 'productIdHere', // Replace with a valid productId
      quantity: 1,
      totalPrice: 99.99,
      status: OrderStatus.PENDING,
    },
  });

  console.log('Order created:', order);
}

seed()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
