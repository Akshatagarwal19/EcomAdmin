import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

enum OrderStatus {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
}

export async function POST(req: NextRequest) {
  try {
    const { userId, productId, quantity } = await req.json();

    if (!userId || !productId || !quantity) {
      return NextResponse.json({ error: 'userId, productId, and quantity are required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const totalPrice = product.price * quantity;

    const order = await prisma.order.create({
      data: {
        userId,
        productId,
        quantity,
        totalPrice,
        status: OrderStatus.PENDING,
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
