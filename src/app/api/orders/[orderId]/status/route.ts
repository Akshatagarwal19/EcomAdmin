import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  // Extract the orderId from the URL path
  const pathParts = req.nextUrl.pathname.split('/');
  const orderId = pathParts[pathParts.length - 2]; // This grabs the last part of the URL

  if (!orderId) {
    console.error("order id missing")
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  try {
    const { status } = await req.json();

    // Validate if the status is a valid OrderStatus
    if (!status || !Object.values(OrderStatus).includes(status)) {
      console.error("invalid status:", status);
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    console.log("Attempting to update order status with Id:",orderId, "to status:", status);

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      console.error("Order not found with ID:", orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    console.log("Order updated successfully:", updatedOrder);
    return NextResponse.json({ updatedOrder }, { status: 200 });
  } catch (error) {
    console.error("Order Update Error:", error);
    return NextResponse.json({ error: 'Failed to update order status', details:  error }, { status: 500 });
  }
}
