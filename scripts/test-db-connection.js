// Script para testar conexão com MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔄 Tentando conectar ao MongoDB...');
    console.log('URI:', process.env.MONGO_URI?.replace(/:[^:]*@/, ':****@')); // Oculta senha
    
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    
    // Lista as coleções
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Coleções disponíveis:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    await mongoose.connection.close();
    console.log('\n✅ Teste concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    process.exit(1);
  }
}

testConnection();
