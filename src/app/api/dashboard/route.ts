import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        
        const totalProducts = await prisma.product.count();

        const totalUsers = await prisma.user.count();

        const totalOrders = await prisma.order.count();

        const totalRevenue = await prisma.order.aggregate({
            _sum: {
                totalPrice: true,
            },
        });

        const dashboardData = {
            totalProducts,
            totalUsers,
            totalOrders,
            totalRevenue: totalRevenue._sum.totalPrice ?? 0, 
        };

        return NextResponse.json(dashboardData, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
