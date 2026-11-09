import { useState } from 'react';
import api from '../api/axios';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const calculateMargin = (compra, venta) => {
  if (!compra || compra === 0) return 0;
  return (((venta - compra) / compra) * 100).toFixed(2);
};

const buildInitialForm = (product, categories) => {
  if (product) {
    return {
      nombre: product.nombre,
      sku: product.sku,
      categoria: product.categoria?._id || '',
      precioCompra: product.precioCompra,
      precioVenta: product.precioVenta,
      stock: product.stock,
      stockMinimo: product.stockMinimo,
      unidadMedida: product.unidadMedida,
      proveedor: product.proveedor || '',
      imagen: product.imagen || '',
    };
  }

  return {
    nombre: '',
    sku: '',
    categoria: categories[0]?._id || '',
    precioCompra: 0,
    precioVenta: 0,
    stock: 0,
    stockMinimo: 5,
    unidadMedida: 'unidad',
    proveedor: '',
    imagen: '',
  };
};

const ProductFormModal = ({ product, categories, isAdmin, onClose, onSaved, onCategoryCreated }) => {
  const [formData, setFormData] = useState(() => buildInitialForm(product, categories));
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const isEditing = Boolean(product);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarginChange = (e) => {
    const margin = parseFloat(e.target.value) || 0;
    const compra = parseFloat(formData.precioCompra) || 0;
    const newVenta = compra * (1 + margin / 100);
    setFormData((prev) => ({ ...prev, precioVenta: parseFloat(newVenta.toFixed(2)) }));
  };

  const resetCategoryForm = () => {
    setShowNewCategory(false);
    setNewCategoryName('');
    setNewCategoryColor('#3b82f6');
  };

  const handleCreateCategory = async () => {
    const nombre = newCategoryName.trim();
    if (!nombre) return toast.error('Ingresá un nombre para la categoría');

    setCreatingCategory(true);
    try {
      const res = await api.post('/categories', {
        nombre,
        color: newCategoryColor,
        icono: 'tag',
      });

      onCategoryCreated(res.data);
      setFormData((prev) => ({ ...prev, categoria: res.data._id }));
      resetCategoryForm();
      toast.success('Categoría creada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear categoría');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/products/${product._id}`, formData);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', formData);
        toast.success('Producto creado');
      }
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar producto');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h3 className="text-xl font-bold text-textLight">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <button onClick={onClose} className="text-textMuted hover:text-textLight"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="productForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-textMuted mb-2">Nombre del Producto</label>
              <input required name="nombre" value={formData.nombre} onChange={handleInputChange} type="text" className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-textMuted mb-2">SKU / Código</label>
              <input required name="sku" value={formData.sku} onChange={handleInputChange} type="text" className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-textMuted">Categoría</label>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowNewCategory((v) => !v)}
                    className="text-xs font-semibold text-primary hover:text-blue-400 flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> Nueva categoría
                  </button>
                )}
              </div>
              <select required name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none">
                {categories.length === 0 && <option value="">No hay categorías</option>}
                {categories.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
              </select>

              {showNewCategory && (
                <div className="mt-3 p-3 bg-background border border-slate-700 rounded-lg space-y-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nombre de la nueva categoría"
                    className="w-full bg-surface border border-slate-700 rounded-lg px-3 py-2 text-sm text-textLight focus:ring-1 focus:ring-primary focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-10 h-9 rounded cursor-pointer bg-transparent border border-slate-700"
                      title="Color de la categoría"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={creatingCategory}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                    >
                      {creatingCategory ? 'Creando...' : 'Agregar categoría'}
                    </button>
                    <button
                      type="button"
                      onClick={resetCategoryForm}
                      className="px-3 py-2 text-sm rounded-lg border border-slate-700 text-textMuted hover:bg-slate-800 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-800/30 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-sm font-medium text-textMuted mb-2">Costo (Precio Compra)</label>
                <input required min="0" step="0.01" name="precioCompra" value={formData.precioCompra} onChange={handleInputChange} type="number" className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-400 mb-2">Margen Ganancia (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={calculateMargin(formData.precioCompra, formData.precioVenta)}
                    onChange={handleMarginChange}
                    className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg px-4 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/50 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-2">Precio Venta Final</label>
                <input required min="0" step="0.01" name="precioVenta" value={formData.precioVenta} onChange={handleInputChange} type="number" className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
              </div>
            </div>

            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-textMuted mb-2">Stock Inicial</label>
                <input required min="0" name="stock" value={formData.stock} onChange={handleInputChange} type="number" className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-textMuted mb-2">Stock Mínimo</label>
              <input required min="0" name="stockMinimo" value={formData.stockMinimo} onChange={handleInputChange} type="number" className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 rounded-b-2xl shrink-0">
          <button onClick={onClose} className="px-6 py-2 rounded-lg border border-slate-700 text-textLight hover:bg-slate-800 transition-colors">Cancelar</button>
          <button type="submit" form="productForm" className="px-6 py-2 rounded-lg bg-primary hover:bg-primaryDark text-white font-semibold transition-colors shadow-lg shadow-primary/20">Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
