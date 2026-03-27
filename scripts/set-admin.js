require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  provider: String,
  email: String,
  password: String,
  role: String,
  isVarified: Boolean,
  stripeCustomerId: String,
  stripePriceId: String,
  stripeCurrentPeriodEnd: String,
  stripeSubscriptionId: String,
  varificationToken: String,
  varificationTokenExpire: Date,
  forgotPasswordToken: String,
  forgotPasswordTokenExpire: Date,
});

const Users = mongoose.models.users || mongoose.model('users', userSchema);

async function setAdmin() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGO_URI não encontrado no .env.local');
      process.exit(1);
    }

    console.log('🔄 Conectando ao MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB');

    const email = 'damiao.negao@gmail.com';
    
    const user = await Users.findOne({ email });
    
    if (!user) {
      console.error(`❌ Usuário com email ${email} não encontrado`);
      process.exit(1);
    }

    console.log(`📧 Usuário encontrado: ${user.name} (${user.email})`);
    console.log(`🔑 Role atual: ${user.role}`);

    user.role = 'admin';
    await user.save();

    console.log('✅ Usuário atualizado para ADMIN com sucesso!');
    console.log(`🎉 ${user.name} agora é administrador`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão fechada');
  }
}

setAdmin();
