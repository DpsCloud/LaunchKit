import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  // Isolamento por Tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true,
  },
  
  // Informações Básicas
  name: {
    type: String,
    required: [true, "Nome do produto é obrigatório"],
    trim: true,
    maxlength: [255, "Nome muito longo"],
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [2000, "Descrição muito longa"],
  },
  
  // Preço
  price: {
    type: Number,
    required: [true, "Preço é obrigatório"],
    min: [0, "Preço não pode ser negativo"],
  },
  
  // Tipo de Produto
  type: {
    type: String,
    enum: ["physical", "service", "menu_item"],
    default: "physical",
  },
  
  // Categoria (livre, definida pelo cliente)
  category: {
    type: String,
    trim: true,
    maxlength: [100, "Categoria muito longa"],
  },
  
  // Imagem
  imageUrl: {
    type: String,
    trim: true,
    maxlength: [500, "URL muito longa"],
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Ordenação
  sortOrder: {
    type: Number,
    default: 0,
  },
  
  // Soft Delete
  deletedAt: {
    type: Date,
    default: null,
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
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// Índices Compostos
productSchema.index({ tenantId: 1, isActive: 1, sortOrder: 1 });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, type: 1 });
productSchema.index({ tenantId: 1, deletedAt: 1 });

// Middleware para atualizar updatedAt
productSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Query helper para filtrar apenas produtos ativos
productSchema.query.active = function () {
  return this.where({ isActive: true, deletedAt: null });
};

// Query helper para filtrar por tenant
productSchema.query.byTenant = function (tenantId: string) {
  return this.where({ tenantId });
};

// Método para soft delete
productSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
