import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Fields, Files, IncomingForm } from 'formidable';
import cloudinary from 'cloudinary';
import { nextRequestToIncomingMessage } from '../create/nextRequestToIncomingMessage';

const prisma = new PrismaClient();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';


type UpdateData = {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  image?: string;
  category?: { connect: { id: string } };
};

// Handler for GET request
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await Promise.resolve(context.params)

  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'An error occurred', error }, { status: 500 });
  }
}

// Handler for PUT request
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await Promise.resolve(context.params)
  const reqWithIncomingMessage = nextRequestToIncomingMessage(req);

  try {
    const { fields, files } = await new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(reqWithIncomingMessage, (err, fields, files) => {
        if (err) reject(new Error(`Form parse error: ${err.message}`));
        else resolve({ fields, files });
      });
    });

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 400 });
    }

    let existingCategoryName = '';
    if (existingProduct.categoryId) {
      const existingCategory = await prisma.category.findUnique({ where: { id: existingProduct.categoryId } });
      existingCategoryName = existingCategory ? existingCategory.name : '';
    }

    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name ?? existingProduct.name;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description ?? existingProduct.description;
    const priceString = Array.isArray(fields.price) ? fields.price[0] : fields.price ?? existingProduct.price.toString();
    const price = parseFloat(priceString);
    const quantityString = Array.isArray(fields.quantity) ? fields.quantity[0] : fields.quantity ?? existingProduct.quantity.toString();
    const quantity = parseInt(quantityString, 10);
    const categoryName = Array.isArray(fields.category) ? fields.category[0] : fields.category ?? existingCategoryName;
    const imageFile = Array.isArray(files.image) ? files.image[0] : undefined;

    let categoryData: UpdateData["category"] = existingProduct.categoryId ? { connect: { id: existingProduct.categoryId } } : undefined;
    if (categoryName && categoryName !== existingCategoryName) {
      const category = await prisma.category.findUnique({ where: { name: categoryName } });
      if (!category) {
        return NextResponse.json({ error: 'Category does not exist' }, { status: 400 });
      }
      categoryData = { connect: { id: category.id } };
    }

    const updateData: UpdateData = {
      name,
      description,
      price,
      quantity: isNaN(quantity) ? undefined : quantity,
    };
    if (imageFile) {
      const uploadResult = await cloudinary.v2.uploader.upload(imageFile.filepath, {
        resource_type: 'image',
        folder: 'ecommerce/products',
      });
      if (!uploadResult || !uploadResult.secure_url) {
        return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
      }
      updateData.image = uploadResult.secure_url;
    }
    if (categoryData) {
      updateData.category = categoryData;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      if (error.message.includes('unexpected')) {
        return NextResponse.json({ error: 'Request Payload is malformed or missing fields.' }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handler for DELETE request
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await Promise.resolve(context.params)

  try {
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
