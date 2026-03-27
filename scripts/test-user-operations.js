// Script para testar operações de usuário
require('dotenv').config();
const mongoose = require('mongoose');

// Schema simplificado para teste
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  provider: String,
  role: String,
  isVarified: Boolean,
  stripeCustomerId: { type: String, unique: true, sparse: true },
});

async function testUserOperations() {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado!\n');

    const User = mongoose.models.users || mongoose.model('users', userSchema);

    // 1. Contar usuários
    const count = await User.countDocuments();
    console.log(`📊 Total de usuários: ${count}`);

    // 2. Listar primeiros 5 usuários (sem mostrar dados sensíveis)
    const users = await User.find()
      .select('name email provider role isVarified')
      .limit(5);
    
    console.log('\n👥 Primeiros usuários:');
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.name} (${user.email}) - ${user.provider} - ${user.role}`);
    });

    // 3. Verificar índices
    const indexes = await User.collection.getIndexes();
    console.log('\n🔑 Índices configurados:');
    Object.keys(indexes).forEach(key => {
      console.log(`  - ${key}:`, JSON.stringify(indexes[key]));
    });

    // 4. Verificar duplicatas de email
    const duplicates = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  Emails duplicados encontrados:');
      duplicates.forEach(dup => console.log(`  - ${dup._id} (${dup.count}x)`));
    } else {
      console.log('\n✅ Nenhum email duplicado encontrado');
    }

    await mongoose.connection.close();
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testUserOperations();
