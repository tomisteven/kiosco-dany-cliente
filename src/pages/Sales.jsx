import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { History, Search, FileText, Ban, Printer, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const Sales = () => {
  const { user } = useContext(AuthContext);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      let url = '/sales?';
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}`;
      
      const res = await api.get(url);
      setSales(res.data);
    } catch (error) {
      toast.error('Error al obtener ventas');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (sale) => {
    setSelectedSale(sale);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleAnular = async (id) => {
    if (window.confirm('¿Está seguro de anular esta venta? Esto repondrá el stock original.')) {
      try {
        await api.patch(`/sales/${id}/anular`);
        toast.success('Venta anulada correctamente');
        fetchSales();
        if (selectedSale && selectedSale._id === id) {
          setSelectedSale(null);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al anular venta');
      }
    }
  };

  const exportToCSV = () => {
     if (!sales || sales.length === 0) return toast.error('No hay ventas para exportar');
     
     let csvContent = "data:text/csv;charset=utf-8,";
     csvContent += "Ticket,Fecha,Hora,Empleado,Metodo Pago,Subtotal,Descuento (%),Total,Estado\n";
     
     sales.forEach(s => {
        const ticket = s.numeroTicket || '';
        const fecha = new Date(s.fecha).toLocaleDateString('es-AR');
        const hora = new Date(s.fecha).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});
        const empleado = `"${(s.empleado?.nombre || 'Desconocido').replace(/"/g, '""')}"`;
        const metodo = s.metodoPago || '';
        const subtotal = s.subtotal || 0;
        const descuento = s.descuento || 0;
        const total = s.totalFinal || 0;
        const estado = s.estado || '';

        csvContent += `${ticket},${fecha},${hora},${empleado},${metodo},${subtotal},${descuento},${total},${estado}\n`;
     });

     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `historial_ventas.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-textLight">Historial de Ventas</h2>
          <p className="text-textMuted text-sm mt-1">Consulta y anulación de tickets emitidos</p>
        </div>
        <div className="flex flex-wrap gap-3 bg-surface p-2 rounded-xl border border-slate-800 items-center">
           <input 
             type="date" 
             value={startDate}
             onChange={e => setStartDate(e.target.value)}
             className="bg-background border border-slate-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
           />
           <span className="text-textMuted flex items-center">-</span>
           <input 
             type="date" 
             value={endDate}
             onChange={e => setEndDate(e.target.value)}
             className="bg-background border border-slate-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
           />
           <button 
             onClick={exportToCSV}
             className="bg-slate-800 hover:bg-slate-700 text-textLight px-3 py-2 rounded-lg transition-colors flex items-center border border-slate-700 shadow-sm ml-auto md:ml-2"
             title="Exportar a Excel/CSV"
           >
             <Download size={18} className="md:mr-2 text-emerald-400" />
             <span className="hidden md:inline">Exportar</span>
           </button>
        </div>
      </div>

      <div className="flex-1 bg-surface border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm text-textLight">
            <thead className="text-xs text-textMuted uppercase bg-slate-900 border-b border-slate-800 sticky top-0">
              <tr>
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Empleado</th>
                <th className="px-6 py-4">Método Pago</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-10 text-textMuted">No se encontraron ventas en este período.</td></tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={(e) => { if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) setSelectedSale(sale); }}>
                    <td className="px-6 py-4 font-mono font-bold text-primary">{sale.numeroTicket}</td>
                    <td className="px-6 py-4">
                       <div>{new Date(sale.fecha).toLocaleDateString()}</div>
                       <div className="text-xs text-textMuted">{new Date(sale.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="px-6 py-4">{sale.empleado?.nombre || 'Desconocido'}</td>
                    <td className="px-6 py-4 uppercase text-xs font-semibold">{sale.metodoPago}</td>
                    <td className="px-6 py-4 text-right font-bold">{formatCurrency(sale.totalFinal)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${sale.estado === 'completada' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-danger/20 text-danger'}`}>
                        {sale.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); handlePrint(sale); }} className="text-slate-400 hover:text-white transition-colors"><Printer size={18} /></button>
                          {(user?.rol === 'admin' && sale.estado === 'completada') && (
                             <button onClick={(e) => { e.stopPropagation(); handleAnular(sale._id); }} className="text-danger hover:text-red-400" title="Anular Venta"><Ban size={18} /></button>
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

      {/* Modal Ticket Details & Print */}
      {selectedSale && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:bg-white print:p-0 print:block">
            <div className="bg-white text-black w-full max-w-sm rounded-xl overflow-hidden shadow-2xl flex flex-col print:shadow-none print:w-[80mm] print:m-0 print:border-none">
               <button onClick={() => setSelectedSale(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 no-print">
                  <X size={32} />
               </button>
               
               <div className="p-6 bg-white shrink-0 print:p-0 print:w-[80mm] print:text-[12px] font-mono">
                  <div className="text-center mb-4">
                     {selectedSale.estado === 'anulada' && <div className="text-red-600 font-bold border-2 border-red-600 inline-block px-4 py-1 rounded-lg mb-4 text-lg transform -rotate-12">ANULADA</div>}
                     <h2 className="text-xl font-bold uppercase">KIOSCO POS</h2>
                     <p className="text-xs mt-2 font-bold bg-gray-200 inline-block px-2 py-1 rounded print:bg-transparent print:border-y print:border-black print:block print:w-full">TICKET NO: {selectedSale.numeroTicket}</p>
                  </div>
                  
                  <div className="border-t border-b border-gray-300 border-dashed py-2 mb-3 text-xs flex justify-between">
                     <span>{new Date(selectedSale.fecha).toLocaleDateString('es-AR')}</span>
                     <span>{new Date(selectedSale.fecha).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}</span>
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
                        {selectedSale.items.map((item, idx) => (
                           <tr key={idx} className="border-b border-gray-100 last:border-0 align-top">
                              <td className="py-1 font-bold">{item.cantidad}x</td>
                              <td className="py-1 pr-1">{item.producto.nombre}</td>
                              <td className="py-1 text-right whitespace-nowrap">{formatCurrency(item.subtotal)}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  <div className="border-t border-gray-300 border-dashed pt-2 text-sm text-right space-y-1">
                     <p>Subtotal: {formatCurrency(selectedSale.subtotal)}</p>
                     {selectedSale.descuento > 0 && <p>Desc {selectedSale.descuento}%: -{formatCurrency(selectedSale.subtotal * selectedSale.descuento / 100)}</p>}
                     <p className="text-lg font-bold mt-2">TOTAL: {formatCurrency(selectedSale.totalFinal)}</p>
                  </div>

                  <div className="mt-4 text-xs space-y-1 text-right border-t border-gray-100 pt-2">
                     <p>Pago: <span className="uppercase font-bold">{selectedSale.metodoPago}</span></p>
                     {selectedSale.metodoPago === 'efectivo' && <p>Recibido: {formatCurrency(selectedSale.montoPagado)}</p>}
                     {selectedSale.metodoPago === 'efectivo' && <p>Vuelto: {formatCurrency(selectedSale.vuelto)}</p>}
                  </div>

                  <div className="mt-6 text-center text-xs">
                     <p>Cajero: {selectedSale.empleado?.nombre}</p>
                     <p className="mt-2 text-[10px] text-gray-500">Documento no válido como factura</p>
                  </div>
               </div>
               
               <div className="p-4 bg-slate-100 no-print mt-auto">
                  <button onClick={() => window.print()} className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg flex justify-center items-center hover:bg-black transition-colors">
                     <Printer size={18} className="mr-2" /> RE-IMPRIMIR TICKET
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Sales;
