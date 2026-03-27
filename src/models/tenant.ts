import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema({
  // Identificação
  name: {
    type: String,
    required: [true, "Nome do negócio é obrigatório"],
    trim: true,
  },
  
  slug: {
    type: String,
    required: [true, "Slug é obrigatório"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"],
  },
  
  // Domínios
  subdomain: {
    type: String,
    required: [true, "Subdomínio é obrigatório"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, "Subdomínio inválido"],
  },
  
  customDomain: {
    type: String,
    unique: true,
    sparse: true, // Permite null/undefined sem violar unique
    lowercase: true,
    trim: true,
  },
  
  // Proprietário (referência ao User)
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  
  // Template e Configuração Visual
  templateId: {
    type: String,
    enum: ["clinic", "salon", "restaurant", "generic"],
    default: "generic",
  },
  
  colorPalette: {
    primary: { type: String, default: "#3B82F6" },
    secondary: { type: String, default: "#10B981" },
    accent: { type: String, default: "#F59E0B" },
    background: { type: String, default: "#FFFFFF" },
    text: { type: String, default: "#1F2937" },
  },
  
  // Seções ativas do template
  activeSections: {
    hero: { type: Boolean, default: true },
    about: { type: Boolean, default: true },
    catalog: { type: Boolean, default: true },
    contact: { type: Boolean, default: true },
    gallery: { type: Boolean, default: false },
    testimonials: { type: Boolean, default: false },
  },
  
  // Configuração do Site
  siteConfig: {
    // Hero
    heroTitle: { type: String, default: "" },
    heroSubtitle: { type: String, default: "" },
    heroImageUrl: { type: String, default: "" },
    
    // Sobre
    aboutTitle: { type: String, default: "Sobre Nós" },
    aboutText: { type: String, default: "" },
    aboutImageUrl: { type: String, default: "" },
    
    // Contato
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    
    // Horários
    businessHours: {
      monday: { type: String, default: "09:00 - 18:00" },
      tuesday: { type: String, default: "09:00 - 18:00" },
      wednesday: { type: String, default: "09:00 - 18:00" },
      thursday: { type: String, default: "09:00 - 18:00" },
      friday: { type: String, default: "09:00 - 18:00" },
      saturday: { type: String, default: "09:00 - 13:00" },
      sunday: { type: String, default: "Fechado" },
    },
    
    // Redes Sociais
    socialMedia: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },
  },
  
  // Billing - Assinatura da Plataforma
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true,
  },
  
  stripeSubscriptionId: {
    type: String,
    unique: true,
    sparse: true,
  },
  
  stripePriceId: {
    type: String,
  },
  
  subscriptionStatus: {
    type: String,
    enum: ["trialing", "active", "past_due", "canceled", "unpaid"],
    default: "trialing",
  },
  
  subscriptionCurrentPeriodEnd: {
    type: Date,
  },
  
  trialEndsAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  isSuspended: {
    type: Boolean,
    default: false,
  },
  
  suspensionReason: {
    type: String,
  },
  
  // Metadados
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  
  lastAccessAt: {
    type: Date,
  },
});

// Índices
tenantSchema.index({ ownerId: 1 });
tenantSchema.index({ subdomain: 1 });
tenantSchema.index({ customDomain: 1 });
tenantSchema.index({ subscriptionStatus: 1 });

// Middleware para atualizar updatedAt
tenantSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Método para verificar se tenant está ativo
tenantSchema.methods.isOperational = function () {
  return (
    this.isActive &&
    !this.isSuspended &&
    (this.subscriptionStatus === "active" || 
     this.subscriptionStatus === "trialing")
  );
};

const Tenant = mongoose.models.Tenant || mongoose.model("Tenant", tenantSchema);

export default Tenant;
