// app/api/upload-statement/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff'
];

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const files = formData.getAll("statements");
    const customerId = formData.get("customerId");
    const customerName = formData.get("customerName");
    const accountNumber = formData.get("accountNumber");
    const filePassword = formData.get("filePassword") || null;
    const token = formData.get("token");

    // Log received data for debugging
    console.log("Received upload request:", {
      customerId,
      customerName,
      accountNumber: accountNumber ? "provided" : "not provided",
      token: token ? "provided" : "not provided",
      filesCount: files.length
    });

    // Validation checks
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded", code: "NO_FILES" }, 
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 files allowed", code: "MAX_FILES_EXCEEDED" }, 
        { status: 400 }
      );
    }

    // Validate each file
    const fileErrors = [];
    const validFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file || typeof file === 'string' || !file.name) {
        fileErrors.push(`File ${i + 1}: Invalid file`);
        continue;
      }

      // Check MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        fileErrors.push(`File ${i + 1} (${file.name}): Only PDF and image files allowed`);
        continue;
      }

      // Check file size (10MB limit per file)
      if (file.size > 10 * 1024 * 1024) {
        fileErrors.push(`File ${i + 1} (${file.name}): File too large (Max 10MB)`);
        continue;
      }

      // Check for duplicate filenames in the same batch
      const isDuplicate = validFiles.some(f => f.name === file.name);
      if (isDuplicate) {
        fileErrors.push(`File ${i + 1} (${file.name}): Duplicate filename in same upload`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return NextResponse.json(
        { 
          error: "No valid files to upload", 
          code: "NO_VALID_FILES",
          details: fileErrors 
        }, 
        { status: 400 }
      );
    }

    // Validate customer and token
    if (!customerId || !token) {
      return NextResponse.json(
        { error: "Customer ID and token required", code: "MISSING_CREDENTIALS" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, token: token },
      include: { statements: true }
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Invalid customer or token", code: "INVALID_CUSTOMER" },
        { status: 404 }
      );
    }

    if (new Date() > customer.tokenExpiry) {
      return NextResponse.json(
        { error: "Link expired", code: "TOKEN_EXPIRED" },
        { status: 410 }
      );
    }

    const totalStatements = customer.statements?.length || 0;
    if (totalStatements + validFiles.length > 20) {
      return NextResponse.json(
        { error: "Maximum total statements limit reached", code: "MAX_STATEMENTS_LIMIT" },
        { status: 400 }
      );
    }

    // Prepare safe name for Cloudinary
    const safeName = customerName
      ?.replace(/[^a-z0-9]/gi, "_")
      .toLowerCase() || "customer";

    const timestamp = Date.now();
    
    const uploadResults = [];
    const uploadErrors = [];
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const cleanFileName = file.name
        .replace(/[^a-z0-9.]/gi, '_')
        .toLowerCase();
      
      const publicId = `statements/${safeName}_${timestamp}_${i + 1}_${cleanFileName}`;
      
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64File = buffer.toString("base64");

        // Determine resource_type based on MIME type
        const isImage = file.type.startsWith('image/');
        const resourceType = isImage ? 'image' : 'raw';

        const uploadResult = await cloudinary.uploader.upload(
          `data:${file.type};base64,${base64File}`,
          {
            public_id: publicId,
            resource_type: resourceType,
            folder: "statements",
          }
        );

        uploadResults.push({
          file,
          uploadResult,
          success: true,
          index: i
        });

      } catch (cloudError) {
        console.error(`Cloudinary Error for file ${file.name}:`, cloudError);
        uploadErrors.push({
          fileName: file.name,
          error: "Failed to upload to cloud storage",
          index: i
        });
      }
    }

    if (uploadResults.length === 0) {
      return NextResponse.json(
        { 
          error: "All files failed to upload", 
          code: "UPLOAD_FAILED",
          details: uploadErrors 
        }, 
        { status: 502 }
      );
    }

    // Save to database with transaction
    let createdStatements = [];
    let dbErrors = [];
    
    try {
      const result = await prisma.$transaction(async (prisma) => {
        const statements = [];
        for (const result of uploadResults) {
          try {
            const statement = await prisma.statement.create({
              data: {
                customerId,
                fileName: result.file.name,
                fileSize: result.file.size,
                mimeType: result.file.type,
                cloudinaryUrl: result.uploadResult.secure_url,
                publicId: result.uploadResult.public_id,
                password: filePassword,
                status: "PENDING",
                uploadedAt: new Date(),
              },
            });
            statements.push(statement);
          } catch (dbError) {
            console.error(`Database Error for file ${result.file.name}:`, dbError);
            dbErrors.push({
              fileName: result.file.name,
              error: "Failed to save to database",
              publicId: result.uploadResult.public_id
            });
          }
        }
        return statements;
      });
      
      createdStatements = result;
    } catch (dbError) {
      console.error("Transaction Error:", dbError);
      
      // Rollback all Cloudinary uploads
      for (const result of uploadResults) {
        try {
          await cloudinary.uploader.destroy(result.uploadResult.public_id, {
            resource_type: result.file.type.startsWith('image/') ? 'image' : 'raw',
          });
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError);
        }
      }
      
      return NextResponse.json(
        { 
          error: "Database error. All uploads rolled back.", 
          code: "DB_ERROR",
          details: "Please try again"
        },
        { status: 500 }
      );
    }

    const response = {
      success: true,
      message: `Successfully uploaded ${createdStatements.length} of ${validFiles.length} files`,
      data: {
        uploaded: createdStatements.map(s => ({
          id: s.id,
          fileName: s.fileName,
          status: s.status,
          uploadedAt: s.uploadedAt
        }))
      }
    };

    if (uploadErrors.length > 0 || dbErrors.length > 0 || fileErrors.length > 0) {
      response.warnings = {
        fileErrors: fileErrors.length > 0 ? fileErrors : undefined,
        uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
        dbErrors: dbErrors.length > 0 ? dbErrors : undefined
      };
    }

    return NextResponse.json(response, { status: 207 });

  } catch (error) {
    console.error("Unexpected Error:", error);
    return NextResponse.json(
      { 
        error: "Something went wrong", 
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}