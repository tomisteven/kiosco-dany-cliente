import React, { useState, useEffect, useCallback, useContext, memo } from 'react';
import api from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, Search, Edit2, Trash2, Image as ImageIcon, PackagePlus, Plus, Minus, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductFormModal from '../components/ProductFormModal';

const currencyFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const formatCurrency = (val) => currencyFormatter.format(val);

const calculateMargin = (compra, venta) => {
  if (!compra || compra === 0) return 0;
  return (((venta - compra) / compra) * 100).toFixed(2);
};

const ProductsTable = memo(({ products, loading, isAdmin, onQuickAdjust, onOpenStock, onEdit, onDelete }) => (
  <div className="overflow-x-auto flex-1 custom-scrollbar">
    <table className="w-full text-left text-sm text-textLight">
      <thead className="text-xs text-textMuted uppercase bg-slate-900 border-b border-slate-800 sticky top-0">
        <tr>
          <th className="px-6 py-4">Producto</th>
          <th className="px-6 py-4">SKU</th>
          <th className="px-6 py-4">Categoría</th>
          <th className="px-6 py-4">Stock</th>
          <th className="px-4 py-4 text-right">Compra</th>
          <th className="px-4 py-4 text-right">Venta</th>
          <th className="px-4 py-4 text-right">Margen</th>
          <th className="px-4 py-4 text-center">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800">
        {loading ? (
          <tr><td colSpan="8" className="text-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
        ) : products.length === 0 ? (
          <tr><td colSpan="8" className="text-center py-10 text-textMuted">No se encontraron productos.</td></tr>
        ) : (
          products.map((p) => (
            <tr key={p._id} className="hover:bg-slate-800/50 transition-colors">
              <td className="px-6 py-4 font-medium flex items-center">
                {p.imagen ? (
                  <img src={p.imagen} alt={p.nombre} className="w-8 h-8 rounded shrink-0 mr-3 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded shrink-0 mr-3 bg-slate-800 flex items-center justify-center text-slate-500"><ImageIcon size={16} /></div>
                )}
                <span className="truncate max-w-[200px]">{p.nombre}</span>
              </td>
              <td className="px-6 py-4 text-textMuted font-mono text-xs">{p.sku}</td>
              <td className="px-6 py-4">{p.categoria?.nombre || '-'}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => onQuickAdjust(p, -1)} disabled={p.stock <= 0} className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"><Minus size={12} /></button>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock > p.stockMinimo ? 'bg-emerald-500/20 text-emerald-500' : p.stock > 0 ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'}`}>
                    {p.stock} {p.unidadMedida === 'unidad' ? 'u.' : p.unidadMedida}
                  </span>
                  <button onClick={() => onQuickAdjust(p, 1)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"><Plus size={12} /></button>
                </div>
              </td>
              <td className="px-4 py-4 text-right">{formatCurrency(p.precioCompra)}</td>
              <td className="px-4 py-4 text-right">{formatCurrency(p.precioVenta)}</td>
              <td className="px-4 py-4 text-right">
                <span className={`text-xs ml-2 ${calculateMargin(p.precioCompra, p.precioVenta) > 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {calculateMargin(p.precioCompra, p.precioVenta)}%
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-center space-x-3">
                  <button onClick={() => onOpenStock(p)} className="text-emerald-400 hover:text-emerald-300" title="Ajustar Stock"><PackagePlus size={16} /></button>
                  <button onClick={() => onEdit(p)} className="text-blue-400 hover:text-blue-300" title="Editar"><Edit2 size={16} /></button>
                  {isAdmin && (
                    <button onClick={() => onDelete(p._id)} className="text-danger hover:text-red-400" title="Eliminar"><Trash2 size={16} /></button>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
));

const Products = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockFormData, setStockFormData] = useState({ tipo: 'entrada', cantidad: '', motivo: '' });
  const [stockProduct, setStockProduct] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const url = debouncedSearch ? `/products?search=${encodeURIComponent(debouncedSearch)}` : '/products';
      const res = await api.get(url);
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openNewModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = useCallback((p) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Producto eliminado');
        fetchProducts();
      } catch {
        toast.error('Error al eliminar');
      }
    }
  }, [fetchProducts]);

  const openStockModal = useCallback((p) => {
    setStockProduct(p);
    setStockFormData({ tipo: 'entrada', cantidad: '', motivo: '' });
    setIsStockModalOpen(true);
  }, []);

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/products/${stockProduct._id}/stock`, stockFormData);
      toast.success('Stock ajustado exitosamente');
      setIsStockModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al ajustar stock');
    }
  };

  const quickAdjustStock = useCallback(async (product, amount) => {
    if (product.stock + amount < 0) return toast.error('El stock no puede ser negativo');

    try {
      const tipo = amount > 0 ? 'entrada' : 'salida';
      await api.patch(`/products/${product._id}/stock`, {
        tipo,
        cantidad: Math.abs(amount),
        motivo: 'Ajuste rápido'
      });
      toast.success('Stock actualizado');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar stock');
    }
  }, [fetchProducts]);

  const exportToCSV = () => {
    if (!products || products.length === 0) return toast.error('No hay productos para exportar');

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Producto,SKU,Categoria,Stock,Unidad,Stock Minimo,Costo,Precio Venta,Margen (%)\n";

    products.forEach(p => {
      const nombre = `"${(p.nombre || '').replace(/"/g, '""')}"`;
      const sku = `"${(p.sku || '').replace(/"/g, '""')}"`;
      const categoria = `"${(p.categoria?.nombre || '').replace(/"/g, '""')}"`;
      const stock = p.stock || 0;
      const unidad = p.unidadMedida || '';
      const min = p.stockMinimo || 0;
      const costo = p.precioCompra || 0;
      const venta = p.precioVenta || 0;
      const margen = calculateMargin(costo, venta);

      csvContent += `${nombre},${sku},${categoria},${stock},${unidad},${min},${costo},${venta},${margen}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventario_completo.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-textLight">Productos</h2>
          <p className="text-textMuted text-sm mt-1">Gestión de inventario y precios</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="bg-slate-800 hover:bg-slate-700 text-textLight px-4 py-2 rounded-lg transition-colors flex items-center border border-slate-700 shadow-sm"
            title="Exportar inventario a Excel/CSV"
          >
            <Download size={18} className="mr-2 text-emerald-400" />
            Exportar
          </button>
          {(user?.rol === 'admin') && (
            <button
              onClick={openNewModal}
              className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-lg shadow-primary/20"
            >
              <PlusCircle size={18} className="mr-2" />
              Nuevo Producto
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-slate-800 shrink-0">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-textLight focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 bg-surface border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <ProductsTable
          products={products}
          loading={loading}
          isAdmin={user?.rol === 'admin'}
          onQuickAdjust={quickAdjustStock}
          onOpenStock={openStockModal}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      </div>

      {isModalOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          isAdmin={user?.rol === 'admin'}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            fetchProducts();
          }}
          onCategoryCreated={(category) => setCategories((prev) => [...prev, category])}
        />
      )}

      {isStockModalOpen && stockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-textLight">Ajustar Stock</h3>
                <p className="text-xs text-textMuted">{stockProduct.nombre}</p>
              </div>
              <button onClick={() => setIsStockModalOpen(false)} className="text-textMuted hover:text-textLight"><X size={24} /></button>
            </div>

            <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-textMuted mb-2">Tipo de Movimiento</label>
                <select required value={stockFormData.tipo} onChange={(e) => setStockFormData({...stockFormData, tipo: e.target.value})} className="w-full bg-background border border-slate-700 rounded-lg px-4 py-3 text-textLight focus:ring-1 focus:ring-primary focus:outline-none">
                  <option value="entrada">Entrada (+)</option>
                  <option value="salida">Salida (-)</option>
                  <option value="ajuste">Ajuste (Reemplazo directo)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-2">{stockFormData.tipo === 'ajuste' ? 'Nuevo Stock Total' : 'Cantidad a mover'}</label>
                <input required min="1" value={stockFormData.cantidad} onChange={(e) => setStockFormData({...stockFormData, cantidad: e.target.value})} type="number" className="w-full bg-background border border-slate-700 rounded-lg px-4 py-3 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-2">Motivo (Opcional)</label>
                <input value={stockFormData.motivo} onChange={(e) => setStockFormData({...stockFormData, motivo: e.target.value})} type="text" placeholder="Ej: Mercadería recibida, Vencimiento..." className="w-full bg-background border border-slate-700 rounded-lg px-4 py-3 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="flex-1 py-3 rounded-lg border border-slate-700 text-textLight hover:bg-slate-800 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors shadow-lg shadow-emerald-500/20">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
