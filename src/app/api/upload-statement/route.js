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

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Get files array (multiple files with same field name)
    const files = formData.getAll("statements");
    const customerId = formData.get("customerId");
    const customerName = formData.get("customerName");
    const accountNumber = formData.get("accountNumber");
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

    // Check file count limit (max 10 files)
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
      
      // Check if it's actually a file
      if (!file || typeof file === 'string' || !file.name) {
        fileErrors.push(`File ${i + 1}: Invalid file`);
        continue;
      }

      // Check file type
      if (file.type !== "application/pdf") {
        fileErrors.push(`File ${i + 1} (${file.name}): Only PDF files allowed`);
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
      }

      validFiles.push(file);
    }

    // If no valid files, return error
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

    // Check if customer exists and token is valid
    const customer = await prisma.customer.findFirst({
      where: { 
        id: customerId, 
        token: token 
      },
      include: {
        statements: true
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Invalid customer or token", code: "INVALID_CUSTOMER" },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (new Date() > customer.tokenExpiry) {
      return NextResponse.json(
        { error: "Link expired", code: "TOKEN_EXPIRED" },
        { status: 410 }
      );
    }

    // Check total statements limit (optional - prevent abuse)
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
    
    // Upload all files to Cloudinary
    const uploadResults = [];
    const uploadErrors = [];
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      // Create a clean filename for Cloudinary
      const cleanFileName = file.name
        .replace(/[^a-z0-9.]/gi, '_')
        .toLowerCase();
      
      const publicId = `statements/${safeName}_${timestamp}_${i + 1}_${cleanFileName}`;
      
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64File = buffer.toString("base64");

        const uploadResult = await cloudinary.uploader.upload(
          `data:application/pdf;base64,${base64File}`,
          {
            public_id: publicId,
            resource_type: "raw",
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

    // If no files uploaded successfully
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

    // Save all successfully uploaded files to database with transaction
    let createdStatements = [];
    let dbErrors = [];
    
    // Use transaction for atomic operation
    try {
      const result = await prisma.$transaction(async (prisma) => {
        const statements = [];
        
        for (const result of uploadResults) {
          try {
            // Remove accountNumber from the data object since it doesn't exist in schema
            const statement = await prisma.statement.create({
              data: {
                customerId,
                fileName: result.file.name,
                fileSize: result.file.size,
                mimeType: result.file.type,
                cloudinaryUrl: result.uploadResult.secure_url,
                publicId: result.uploadResult.public_id,
                status: "PENDING",
                uploadedAt: new Date(),
                // Note: accountNumber is not included as it doesn't exist in the schema
                // If you need to store accountNumber, you need to add it to your Prisma schema first
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
            resource_type: "raw",
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

    // Prepare response
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

    // Add warnings if there were issues
    if (uploadErrors.length > 0 || dbErrors.length > 0 || fileErrors.length > 0) {
      response.warnings = {
        fileErrors: fileErrors.length > 0 ? fileErrors : undefined,
        uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
        dbErrors: dbErrors.length > 0 ? dbErrors : undefined
      };
    }

    return NextResponse.json(response, { status: 207 }); // 207 Multi-Status

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