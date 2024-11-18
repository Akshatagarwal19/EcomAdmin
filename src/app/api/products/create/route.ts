import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Fields, Files, IncomingForm } from 'formidable';
import cloudinary from 'cloudinary';
import { nextRequestToIncomingMessage } from './nextRequestToIncomingMessage';

const prisma = new PrismaClient();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const reqWithIncomingMessage = nextRequestToIncomingMessage(req);
  try {
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    const { fields, files } = await new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(reqWithIncomingMessage, (err, fields, files) => {
        if (err) reject(new Error(`Form parse error: ${err.message}`));
        else resolve({ fields, files });
      });
    });
    console.log('Parsed fields:', fields);
    console.log('Parsed files:', files);

    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name ?? '';
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description ?? '';
    const priceString = Array.isArray(fields.price) ? fields.price[0] : fields.price ?? '0';
    const price = parseFloat(priceString);
    const quantityString = Array.isArray(fields.quantity) ? fields.quantity[0] : fields.quantity ?? '0';
    const quantity = parseInt(quantityString, 10);
    const categoryName = Array.isArray(fields.category) ? fields.category[0] : fields.category ?? '';
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!name || !price || isNaN(price) || !imageFile || !categoryName) {
      return NextResponse.json({ error: 'Name, price, image, and category are required and must be valid' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { name: categoryName } });
    if (!category) {
      return NextResponse.json({ error: 'Category does not exist' }, { status: 400 });
    }

    const categoryData = { connect: { id: category.id } };

    const uploadResult = await cloudinary.v2.uploader.upload(imageFile.filepath, {
      resource_type: 'image',
      folder: 'ecommerce/products',
    });

    console.log('Image upload result:', uploadResult);

    if (!uploadResult || !uploadResult.secure_url) {
      return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price,
        quantity: isNaN(quantity) ? undefined : quantity,
        category: categoryData,
        image: uploadResult.secure_url,
      },
    });

    console.log('Product created successfully:', newProduct);

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Error details:', error);
    if (error instanceof Error) {
      if (error.message.includes('unexpected')) {
        return NextResponse.json({ error: 'Request payload is malformed or missing required fields.' }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
