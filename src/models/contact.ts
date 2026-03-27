import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  // Isolamento por Tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true,
  },
  
  // Informações do Contato
  name: {
    type: String,
    required: [true, "Nome é obrigatório"],
    trim: true,
    maxlength: [255, "Nome muito longo"],
  },
  
  phone: {
    type: String,
    required: [true, "Telefone é obrigatório"],
    trim: true,
    maxlength: [30, "Telefone inválido"],
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [255, "Email muito longo"],
  },
  
  // Origem do Contato
  source: {
    type: String,
    enum: ["form", "manual", "order"],
    required: true,
  },
  
  // Status do Lead
  status: {
    type: String,
    enum: ["new", "contacted", "client", "inactive"],
    default: "new",
  },
  
  // Anotações
  notes: {
    type: String,
    trim: true,
    maxlength: [5000, "Anotações muito longas"],
  },
  
  // Histórico de Interações
  interactions: [{
    type: {
      type: String,
      enum: ["call", "whatsapp", "email", "visit", "note"],
    },
    description: String,
    timestamp: { type: Date, default: Date.now },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  }],
  
  // Referência a Pedidos (se source=order)
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  }],
  
  // Tags personalizadas
  tags: [String],
  
  // Metadados
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  
  lastContactedAt: {
    type: Date,
  },
});

// Índices
contactSchema.index({ tenantId: 1, createdAt: -1 });
contactSchema.index({ tenantId: 1, status: 1 });
contactSchema.index({ tenantId: 1, source: 1 });
contactSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
contactSchema.index({ tenantId: 1, email: 1 });

// Middleware para atualizar updatedAt
contactSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Método para adicionar interação
contactSchema.methods.addInteraction = function (
  type: string,
  description: string,
  userId?: string
) {
  this.interactions.push({
    type,
    description,
    timestamp: new Date(),
    createdBy: userId,
  });
  this.lastContactedAt = new Date();
  return this.save();
};

// Método para atualizar status
contactSchema.methods.updateStatus = function (newStatus: string) {
  this.status = newStatus;
  return this.save();
};

// Query helper para filtrar por tenant
contactSchema.query.byTenant = function (tenantId: string) {
  return this.where({ tenantId });
};

// Query helper para novos leads
contactSchema.query.newLeads = function () {
  return this.where({ status: "new" });
};

const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

export default Contact;
