import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, context: { params: { id: string } }) {
    const { id } = await Promise.resolve(context.params)
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error fetching user' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
    const { id } = await Promise.resolve(context.params)

    try {
        const { name, role } = await req.json();

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, role },
        });

        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
    }
}
// DELETE /api/users/[id]
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
    const { id } = await Promise.resolve(context.params)

    try {
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
    }
}
