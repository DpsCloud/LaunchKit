// Script para verificar e corrigir emails duplicados
require('dotenv').config();
const mongoose = require('mongoose');

async function checkDuplicates() {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado!\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Buscar emails duplicados
    const duplicates = await usersCollection.aggregate([
      { $group: { 
          _id: '$email', 
          count: { $sum: 1 },
          ids: { $push: '$_id' },
          names: { $push: '$name' }
        } 
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (duplicates.length === 0) {
      console.log('✅ Nenhum email duplicado encontrado!');
    } else {
      console.log(`⚠️  Encontrados ${duplicates.length} emails duplicados:\n`);
      
      for (const dup of duplicates) {
        console.log(`📧 Email: ${dup._id}`);
        console.log(`   Quantidade: ${dup.count}`);
        console.log(`   IDs: ${dup.ids.join(', ')}`);
        console.log(`   Nomes: ${dup.names.join(', ')}`);
        console.log('');
      }

      console.log('💡 Para remover duplicatas, você pode:');
      console.log('   1. Deletar manualmente pelo MongoDB Compass');
      console.log('   2. Usar o script de limpeza (criar se necessário)');
      console.log('   3. Manter apenas o registro mais recente');
    }

    await mongoose.connection.close();
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkDuplicates();
