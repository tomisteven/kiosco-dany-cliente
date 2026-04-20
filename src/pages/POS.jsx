import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { 
  Search, Plus, Minus, Trash2, Printer, CheckCircle, Tag, ShoppingCart, XCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

const POS = () => {
  const { user } = useContext(AuthContext);
  const { 
    cartItems, addToCart, updateQuantity, removeFromCart, clearCart, 
    discount, setDiscount, cartSubtotal, cartTotal 
  } = useContext(CartContext);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [activeCategory, setActiveCategory] = useState('');

  // Payment
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  
  // Checkout Modal
  const [showModal, setShowModal] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  
  const printRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, activeCategory]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/products?';
      if (debouncedSearch) url += `search=${debouncedSearch}&`;
      if (activeCategory) url += `category=${activeCategory}`;
      
      const res = await api.get(url);
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMontoChange = (e) => {
    setMontoRecibido(e.target.value);
  };

  const vueltoCalculado = montoRecibido ? (parseFloat(montoRecibido) - cartTotal) : 0;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return toast.error('El carrito está vacío');
    if (metodoPago === 'efectivo' && montoRecibido && parseFloat(montoRecibido) < cartTotal) {
      return toast.error('El monto recibido es menor al total');
    }

    try {
      const payload = {
        items: cartItems.map(i => ({ producto: i.producto, cantidad: i.cantidad })),
        descuento: discount,
        metodoPago,
        montoPagado: metodoPago === 'efectivo' && montoRecibido ? parseFloat(montoRecibido) : cartTotal
      };

      const res = await api.post('/sales', payload);
      setTicketData(res.data);
      setShowModal(true);
      toast.success('Venta registrada con éxito');
    } catch (error) {
       toast.error(error.response?.data?.message || 'Error al procesar la venta');
    }
  };

  const printTicket = () => {
    window.print();
  };

  const handleNextSale = () => {
    setShowModal(false);
    setTicketData(null);
    clearCart();
    setMetodoPago('efectivo');
    setMontoRecibido('');
    fetchProducts(); // refresh stock
  };

  const handleCancelLastSale = async () => {
    if(!ticketData) return;
    if(window.confirm('¿Anular esta venta recién hecha y devolver los productos al stock?')) {
      try {
        await api.patch(`/sales/${ticketData._id}/anular`);
        toast.success('Venta anulada con éxito. Stock devuelto.');
        setShowModal(false);
        setTicketData(null);
        fetchProducts(); // refresh stock para ver los productos devueltos
      } catch (error) {
        toast.error('Error al anular venta');
      }
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <div className="h-[calc(100vh-4rem)] md:h-full flex flex-col md:flex-row gap-6">
      {/* Columna Izquierda - Catálogo */}
      <div className="w-full md:w-[60%] lg:w-[65%] flex flex-col gap-4 overflow-hidden h-full">
        {/* Buscador y Filtros */}
        <div className="bg-surface p-4 rounded-xl border border-slate-800 shrink-0">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-textLight focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <button 
              onClick={() => setActiveCategory('')}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${activeCategory === '' ? 'bg-primary text-white' : 'bg-slate-800 text-textMuted hover:bg-slate-700'}`}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button 
                key={c._id}
                onClick={() => setActiveCategory(c._id)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 border border-transparent`}
                style={{
                  backgroundColor: activeCategory === c._id ? `${c.color}20` : '#1e293b',
                  color: activeCategory === c._id ? c.color : '#94a3b8',
                  borderColor: activeCategory === c._id ? c.color : 'transparent'
                }}
              >
                <Tag size={12} fill={activeCategory === c._id ? c.color : 'none'} />
                {c.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Productos */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 md:pb-0">
          {loading ? (
             <div className="col-span-full flex justify-center py-10">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-10 text-textMuted">
              No se encontraron productos.
            </div>
          ) : (
            products.map((p) => {
               const itemInCart = cartItems.find(i => i.producto === p._id);
               const currentQty = itemInCart ? itemInCart.cantidad : 0;
               const available = p.stock - currentQty;
               
               return (
                <div 
                  key={p._id} 
                  onClick={() => {
                    if (available > 0) addToCart(p);
                    else toast.error('Stock insuficiente');
                  }}
                  className={`bg-surface p-4 rounded-xl border flex flex-col h-full cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-lg ${available <= 0 ? 'opacity-50 border-danger/50 cursor-not-allowed' : 'border-slate-800 hover:border-primary/50'}`}
                >
                  <p className="text-xs text-textMuted font-mono mb-1">{p.sku}</p>
                  <h4 className="font-semibold text-textLight leading-tight mb-2 flex-grow line-clamp-2">{p.nombre}</h4>
                  
                  <div className="flex justify-between items-end mt-2">
                    <p className="font-bold text-lg text-primary">{formatCurrency(p.precioVenta)}</p>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${available > p.stockMinimo ? 'bg-emerald-500/20 text-emerald-500' : available > 0 ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'}`}>
                      {available} disp.
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Columna Derecha - Carrito / Ticket */}
      <div className="w-full md:w-[40%] lg:w-[35%] bg-surface border border-slate-800 rounded-xl flex flex-col h-[60vh] md:h-full mt-4 md:mt-0 shadow-lg">
         <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-xl shrink-0">
            <h3 className="font-bold text-lg text-textLight flex items-center">
               <ShoppingCart className="mr-2 text-primary" size={20} />
               Venta Actual
            </h3>
            {cartItems.length > 0 && (
               <button onClick={clearCart} className="text-xs text-danger hover:text-red-400 transition-colors flex items-center">
                  <Trash2 size={12} className="mr-1" /> Vaciar
               </button>
            )}
         </div>

         {/* Items del Carrito */}
         <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cartItems.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-textMuted opacity-50">
                  <ShoppingCart size={48} className="mb-4" />
                  <p>El carrito está vacío</p>
               </div>
            ) : (
               cartItems.map((item) => (
                  <div key={item.producto} className="flex justify-between items-center bg-background p-3 rounded-lg border border-slate-800">
                     <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-textLight text-sm truncate">{item.nombre}</p>
                        <p className="text-primary font-semibold text-sm">{formatCurrency(item.subtotal)} <span className="text-xs text-textMuted font-normal ml-1">({formatCurrency(item.precioVenta)} c/u)</span></p>
                     </div>
                     <div className="flex items-center gap-2 shrink-0 bg-slate-800 rounded-lg p-1">
                        <button onClick={() => updateQuantity(item.producto, item.cantidad - 1)} className="w-7 h-7 flex items-center justify-center rounded bg-slate-700 text-white hover:bg-slate-600">
                           <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-textLight">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.producto, item.cantidad + 1)} disabled={item.cantidad >= item.stockMaximo} className="w-7 h-7 flex items-center justify-center rounded bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50">
                           <Plus size={14} />
                        </button>
                     </div>
                  </div>
               ))
            )}
         </div>

         {/* Totales y Pago */}
         <div className="p-4 border-t border-slate-800 bg-slate-900/80 rounded-b-xl shrink-0">
            <div className="flex justify-between items-center mb-2">
               <span className="text-textMuted">Subtotal</span>
               <span className="text-textLight font-medium">{formatCurrency(cartSubtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center mb-4">
               <span className="text-textMuted flex items-center gap-2">
                  Descuento %
               </span>
               <input 
                  type="number" 
                  min="0" max="100" 
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-16 bg-surface border border-slate-700 rounded text-right px-2 py-1 text-sm text-textLight focus:outline-none focus:border-primary"
               />
            </div>

            <div className="mb-4">
               <label className="text-xs text-textMuted block mb-1">Método de Pago</label>
               <div className="grid grid-cols-3 gap-2">
                  {['efectivo', 'tarjeta', 'transferencia'].map(m => (
                     <button
                        key={m}
                        onClick={() => setMetodoPago(m)}
                        className={`py-2 rounded-lg text-xs font-semibold capitalize transition-colors border ${metodoPago === m ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-slate-700 text-textMuted hover:border-slate-500'}`}
                     >
                        {m}
                     </button>
                  ))}
               </div>
            </div>

            {metodoPago === 'efectivo' && (
               <div className="flex gap-2 mb-4">
                  <div className="flex-1">
                     <label className="text-xs text-textMuted block mb-1">Recibido</label>
                     <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input 
                           type="number" 
                           value={montoRecibido}
                           onChange={handleMontoChange}
                           className="w-full bg-surface border border-slate-700 rounded-lg pl-6 pr-3 py-2 text-textLight focus:outline-none focus:border-primary font-bold"
                           placeholder="0.00"
                        />
                     </div>
                  </div>
                  <div className="flex-1">
                     <label className="text-xs text-textMuted block mb-1">Vuelto</label>
                     <div className={`w-full bg-surface px-3 py-2 rounded-lg border flex items-center h-10 ${vueltoCalculado < 0 ? 'border-danger/50 text-danger' : 'border-slate-800 text-emerald-400'} font-bold`}>
                        {vueltoCalculado < 0 ? 'Monto Inválido' : formatCurrency(vueltoCalculado)}
                     </div>
                  </div>
               </div>
            )}

            <div className="flex justify-between items-center mt-2 mb-4">
               <span className="text-xl text-textLight font-bold">Total</span>
               <span className="text-3xl text-primary font-black">{formatCurrency(cartTotal)}</span>
            </div>

            <button 
               onClick={handleCheckout}
               disabled={cartItems.length === 0 || loading || (metodoPago === 'efectivo' && montoRecibido && parseFloat(montoRecibido) < cartTotal)}
               className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/30 disabled:text-white/50 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 uppercase tracking-wide transition-colors shadow-lg shadow-emerald-500/20"
            >
               Confirmar Venta
            </button>
         </div>
      </div>

      {/* Modal Ticket */}
      {showModal && ticketData && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:bg-white print:p-0 print:block">
            <div className="bg-white text-black w-full max-w-sm rounded-xl overflow-hidden shadow-2xl flex flex-col print:shadow-none print:w-[80mm] print:m-0 print:border-none">
               {/* BANNER NOTIFICACION EXITO (NO IMPRIMIBLE) */}
               <div className="bg-emerald-500 text-white text-center py-3 font-bold no-print flex items-center justify-center gap-2">
                  <CheckCircle size={20} /> ¡Venta Registrada Exitosamente!
               </div>

               {/* Contenido Imprimible */}
               <div ref={printRef} className="p-6 bg-white shrink-0 print:p-0 print:w-[80mm] print:text-[12px] font-mono ticket-content">
                  <div className="text-center mb-4">
                     <h2 className="text-xl font-bold uppercase">KIOSCO POS</h2>
                     <p className="text-xs">Av. Falsa 123 - Venta Minorista</p>
                     <p className="text-xs mt-2 font-bold bg-gray-200 inline-block px-2 py-1 rounded print:bg-transparent print:border-y print:border-black print:block print:w-full">TICKET NO: {ticketData.numeroTicket}</p>
                  </div>
                  
                  <div className="border-t border-b border-gray-300 border-dashed py-2 mb-3 text-xs flex justify-between">
                     <span>{new Date(ticketData.fecha).toLocaleDateString('es-AR')}</span>
                     <span>{new Date(ticketData.fecha).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>

                  <table className="w-full text-xs text-left mb-3">
                     <thead>
                        <tr className="border-b border-gray-200">
                           <th className="pb-1 w-8">Cant</th>
                           <th className="pb-1">Desc</th>
                           <th className="pb-1 text-right">SubT</th>
                        </tr>
                     </thead>
                     <tbody>
                        {ticketData.items.map((item, idx) => (
                           <tr key={idx} className="border-b border-gray-100 last:border-0 align-top">
                              <td className="py-1 font-bold">{item.cantidad}x</td>
                              <td className="py-1 pr-1 truncate max-w-[120px]">{item.producto.nombre}</td>
                              <td className="py-1 text-right whitespace-nowrap">{formatCurrency(item.subtotal)}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  <div className="border-t border-gray-300 border-dashed pt-2 text-sm text-right space-y-1">
                     <p>Subtotal: {formatCurrency(ticketData.subtotal)}</p>
                     {ticketData.descuento > 0 && <p>Desc {ticketData.descuento}%: -{formatCurrency(ticketData.subtotal * ticketData.descuento / 100)}</p>}
                     <p className="text-lg font-bold mt-2">TOTAL: {formatCurrency(ticketData.totalFinal)}</p>
                  </div>

                  <div className="mt-4 text-xs space-y-1 text-right border-t border-gray-100 pt-2">
                     <p>Pago: <span className="uppercase font-bold">{ticketData.metodoPago}</span></p>
                     <p>Recibido: {formatCurrency(ticketData.montoPagado)}</p>
                     <p>Vuelto: {formatCurrency(ticketData.vuelto)}</p>
                  </div>

                  <div className="mt-6 text-center text-xs">
                     <p>Cajero: {ticketData.empleado?.nombre || user?.nombre}</p>
                     <p className="mt-2 text-[10px] text-gray-500">¡Gracias por su compra!</p>
                  </div>
               </div>

               {/* Botonera No Imprimible */}
               <div className="p-4 bg-slate-100 flex flex-col gap-3 border-t border-gray-200 no-print mt-auto">
                  <div className="flex gap-3">
                     <button 
                        onClick={printTicket}
                        className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-lg flex justify-center items-center hover:bg-black transition-colors"
                     >
                        <Printer size={18} className="mr-2" />
                        Imprimir
                     </button>
                     <button 
                        onClick={handleNextSale}
                        className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-lg flex justify-center items-center hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 w-full"
                     >
                        <CheckCircle size={18} className="mr-2" />
                        Siguiente
                     </button>
                  </div>
                  <button 
                     onClick={handleCancelLastSale}
                     className="w-full bg-danger/10 text-danger border border-danger/20 font-bold py-2 rounded-lg flex justify-center items-center hover:bg-danger/20 transition-colors"
                  >
                     <XCircle size={18} className="mr-2" />
                     Anular esta venta (Deshacer)
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default POS;
