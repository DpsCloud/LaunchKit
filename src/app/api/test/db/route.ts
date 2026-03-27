import connectDB from "@/configs/dbConfig/dbConfig";
import Users from "@/models/user";
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

// Rota protegida - apenas para testes em desenvolvimento
export async function GET(request: NextRequest) {
  try {
    // Apenas em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: "Rota disponível apenas em desenvolvimento" },
        { status: 403 }
      );
    }

    await connectDB();

    // Estatísticas básicas
    const totalUsers = await Users.countDocuments();
    const verifiedUsers = await Users.countDocuments({ isVarified: true });
    const googleUsers = await Users.countDocuments({ provider: 'google' });
    const credentialUsers = await Users.countDocuments({ provider: 'credentials' });

    // Verificar duplicatas
    const duplicateEmails = await Users.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    // Verificar índices
    const indexes = await Users.collection.getIndexes();

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        name: Users.db.name
      },
      statistics: {
        totalUsers,
        verifiedUsers,
        googleUsers,
        credentialUsers
      },
      duplicates: {
        count: duplicateEmails.length,
        emails: duplicateEmails.map(d => d._id)
      },
      indexes: Object.keys(indexes)
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
