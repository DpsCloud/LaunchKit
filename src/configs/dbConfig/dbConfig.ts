import mongoose from "mongoose";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const uri = process.env.MONGO_URI || "";
    if (!uri) {
      console.error("❌ Erro: MONGO_URI não está definida no arquivo .env");
      return;
    }

    console.log("⏳ Conectando ao MongoDB...");
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10, // Importante para produção
    });

    console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
    
    // Sincronizar índices em desenvolvimento
    if (process.env.NODE_ENV !== "production") {
      // mongoose.set("debug", true);
    }

  } catch (error: any) {
    console.error(`❌ Erro de conexão com MongoDB: ${error.message}`);
    // Não encerra o processo no ambiente local para não derrubar o servidor
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

export default connectDB;
