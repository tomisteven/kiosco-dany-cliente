import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, Search, Edit2, Trash2, X, Image as ImageIcon, PackagePlus, Plus, Minus, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const Products = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', sku: '', categoria: '', precioCompra: 0, precioVenta: 0, 
    stock: 0, stockMinimo: 5, unidadMedida: 'unidad', proveedor: '', imagen: ''
  });

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockFormData, setStockFormData] = useState({ tipo: 'entrada', cantidad: '', motivo: '' });
  const [stockProduct, setStockProduct] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, categoria: res.data[0]._id }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = debouncedSearch ? `/products?search=${debouncedSearch}` : '/products';
      const res = await api.get(url);
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMargin = (compra, venta) => {
    if (!compra || compra === 0) return 0;
    return (((venta - compra) / compra) * 100).toFixed(2);
  };

  const handleMarginChange = (e) => {
    const margin = parseFloat(e.target.value) || 0;
    const compra = parseFloat(formData.precioCompra) || 0;
    const newVenta = compra * (1 + (margin / 100));
    setFormData({ ...formData, precioVenta: parseFloat(newVenta.toFixed(2)) });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      nombre: '', sku: '', categoria: categories[0]?._id || '', 
      precioCompra: 0, precioVenta: 0, stock: 0, stockMinimo: 5, 
      unidadMedida: 'unidad', proveedor: '', imagen: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingId(p._id);
    setFormData({
      nombre: p.nombre, sku: p.sku, categoria: p.categoria._id, 
      precioCompra: p.precioCompra, precioVenta: p.precioVenta, 
      stock: p.stock, stockMinimo: p.stockMinimo, 
      unidadMedida: p.unidadMedida, proveedor: p.proveedor || '', imagen: p.imagen || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', formData);
        toast.success('Producto creado');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar producto');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Producto eliminado');
        fetchProducts();
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  const openStockModal = (p) => {
    setStockProduct(p);
    setStockFormData({ tipo: 'entrada', cantidad: '', motivo: '' });
    setIsStockModalOpen(true);
  };

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

  const quickAdjustStock = async (product, amount) => {
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
  };

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
                         <div className="w-8 h-8 rounded shrink-0 mr-3 bg-slate-800 flex items-center justify-center text-slate-500"><ImageIcon size={16}/></div>
                       )}
                       <span className="truncate max-w-[200px]">{p.nombre}</span>
                    </td>
                    <td className="px-6 py-4 text-textMuted font-mono text-xs">{p.sku}</td>
                    <td className="px-6 py-4">{p.categoria?.nombre || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => quickAdjustStock(p, -1)} disabled={p.stock <= 0} className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"><Minus size={12} /></button>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock > p.stockMinimo ? 'bg-emerald-500/20 text-emerald-500' : p.stock > 0 ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'}`}>
                          {p.stock} {p.unidadMedida === 'unidad' ? 'u.' : p.unidadMedida}
                        </span>
                        <button onClick={() => quickAdjustStock(p, 1)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"><Plus size={12} /></button>
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
                          <button onClick={() => openStockModal(p)} className="text-emerald-400 hover:text-emerald-300" title="Ajustar Stock"><PackagePlus size={16} /></button>
                          <button onClick={() => openEditModal(p)} className="text-blue-400 hover:text-blue-300" title="Editar"><Edit2 size={16} /></button>
                          {(user?.rol === 'admin') && (
                             <button onClick={() => handleDelete(p._id)} className="text-danger hover:text-red-400" title="Eliminar"><Trash2 size={16} /></button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-textLight">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-textMuted hover:text-textLight"><X size={24} /></button>
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
                    <label className="block text-sm font-medium text-textMuted mb-2">Categoría</label>
                    <select required name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none">
                       {categories.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                    </select>
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

                 {!editingId && (
                    <div>
                       <label className="block text-sm font-medium text-textMuted mb-2">Stock Inicial</label>
                       <input required min="0" name="stock" value={formData.stock} onChange={handleInputChange} type="number" className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
                    </div>
                 )}

                 <div>
                    <label className="block text-sm font-medium text-textMuted mb-2">Stock Mínimo</label>
                    <input required min="0" name="stockMinimo" value={formData.stockMinimo} onChange={handleInputChange} type="number" className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
                 </div>

                 {/* Espacio reservado para centrar */}
               </form>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 rounded-b-2xl shrink-0">
               <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg border border-slate-700 text-textLight hover:bg-slate-800 transition-colors">Cancelar</button>
               <button type="submit" form="productForm" className="px-6 py-2 rounded-lg bg-primary hover:bg-primaryDark text-white font-semibold transition-colors shadow-lg shadow-primary/20">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajuste Stock */}
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
