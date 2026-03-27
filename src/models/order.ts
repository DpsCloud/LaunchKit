import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  subtotal: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema({
  // Isolamento por Tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true,
  },
  
  // Número do Pedido (sequencial por tenant)
  orderNumber: {
    type: String,
    required: true,
  },
  
  // Informações do Cliente
  customerName: {
    type: String,
    required: [true, "Nome do cliente é obrigatório"],
    trim: true,
    maxlength: [255, "Nome muito longo"],
  },
  
  customerPhone: {
    type: String,
    required: [true, "Telefone é obrigatório"],
    trim: true,
    maxlength: [30, "Telefone inválido"],
  },
  
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [255, "Email muito longo"],
  },
  
  // Itens do Pedido (snapshot)
  items: [orderItemSchema],
  
  // Valores
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  
  // Modo de Pagamento
  mode: {
    type: String,
    enum: ["online_payment", "reservation"],
    required: true,
  },
  
  // Status do Pedido
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"],
    default: "pending",
  },
  
  // Stripe (para modo online_payment)
  stripePaymentIntentId: {
    type: String,
    unique: true,
    sparse: true,
  },
  
  stripePaymentStatus: {
    type: String,
    enum: ["pending", "succeeded", "failed", "cancelled"],
  },
  
  // Observações
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, "Observações muito longas"],
  },
  
  // Cancelamento
  cancelledAt: {
    type: Date,
  },
  
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, "Motivo muito longo"],
  },
  
  // Histórico de Status
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  }],
  
  // Metadados
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Índices
orderSchema.index({ tenantId: 1, createdAt: -1 });
orderSchema.index({ tenantId: 1, status: 1 });
orderSchema.index({ tenantId: 1, mode: 1 });
orderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ stripePaymentIntentId: 1 });
orderSchema.index({ customerPhone: 1 });

// Middleware para atualizar updatedAt
orderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Método para atualizar status
orderSchema.methods.updateStatus = function (newStatus: string, userId?: string) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: userId,
  });
  return this.save();
};

// Método para cancelar pedido
orderSchema.methods.cancel = function (reason: string, userId?: string) {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.statusHistory.push({
    status: "cancelled",
    timestamp: new Date(),
    updatedBy: userId,
  });
  return this.save();
};

// Query helper para filtrar por tenant
orderSchema.query.byTenant = function (tenantId: string) {
  return this.where({ tenantId });
};

// Query helper para pedidos pendentes
orderSchema.query.pending = function () {
  return this.where({ status: "pending" });
};

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
