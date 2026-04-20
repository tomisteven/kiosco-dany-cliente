import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, ShoppingCart, DollarSign, Receipt, AlertTriangle, PlusCircle 
} from 'lucide-react';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSummary, resLow] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/products/low-stock')
        ]);
        
        // Formatear datos para el grafico
        const chartData = resSummary.data.ventasPorHora.map(item => ({
          hora: `${item._id}:00`,
          total: item.total
        }));
        
        setSummary({ ...resSummary.data, chartData });
        setLowStock(resLow.data);
      } catch (error) {
        console.error('Error cargando dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (value) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-textLight">Dashboard</h2>
          <p className="text-textMuted text-sm mt-1">Resumen de ventas del día</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/products" className="bg-surface hover:bg-slate-800 border border-slate-700 text-textLight px-4 py-2 rounded-lg transition-colors flex items-center">
            <PlusCircle size={18} className="mr-2" />
            Producto
          </Link>
          <Link to="/pos" className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-lg shadow-primary/20">
            <ShoppingCart size={18} className="mr-2" />
            Nueva Venta
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-6 rounded-xl border border-slate-800 flex items-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mr-4">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-textMuted text-sm font-medium">Facturación Hoy</p>
            <p className="text-2xl font-bold text-textLight">{formatCurrency(summary?.facturacionHoy || 0)}</p>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-slate-800 flex items-center shadow-sm">
           <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center mr-4">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-textMuted text-sm font-medium">Ganancia Hoy</p>
            <p className="text-2xl font-bold text-textLight">{formatCurrency(summary?.gananciaHoy || 0)}</p>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-slate-800 flex items-center shadow-sm">
           <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center mr-4">
            <Receipt size={24} />
          </div>
          <div>
            <p className="text-textMuted text-sm font-medium">Tickets Emitidos</p>
            <p className="text-2xl font-bold text-textLight">{summary?.ventasHoy || 0}</p>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-slate-800 flex items-center shadow-sm">
           <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mr-4">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-textMuted text-sm font-medium">Alertas de Stock</p>
            <p className="text-2xl font-bold text-textLight">{lowStock.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold text-textLight mb-6">Ventas por Hora</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="hora" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip 
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                  formatter={(value) => [formatCurrency(value), 'Total']} 
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lists */}
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl border border-slate-800 shadow-sm">
             <h3 className="text-lg font-semibold text-textLight mb-4 flex items-center">
              Top Productos 
              <span className="text-xs bg-slate-800 text-textMuted px-2 py-1 rounded ml-2">Hoy</span>
             </h3>
             <div className="space-y-4">
                {summary?.topProducts?.length === 0 ? (
                  <p className="text-textMuted text-sm">No hay ventas registradas hoy.</p>
                ) : (
                  summary?.topProducts?.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded bg-slate-800 text-xs flex items-center justify-center font-bold text-textMuted mr-3">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-textLight">{p.nombre}</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">{p.cantidad} u.</p>
                    </div>
                  ))
                )}
             </div>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-slate-800 shadow-sm">
             <h3 className="text-lg font-semibold text-textLight mb-4 flex items-center text-amber-500">
               Stock Bajo
             </h3>
             <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {lowStock.length === 0 ? (
                  <p className="text-textMuted text-sm">Todo el stock está en orden.</p>
                ) : (
                  lowStock.map((p) => (
                    <div key={p._id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                      <div>
                        <p className="text-sm font-medium text-textLight">{p.nombre}</p>
                        <p className="text-xs text-textMuted mt-0.5">Mínimo: {p.stockMinimo}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold ${p.stock === 0 ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}>
                        {p.stock} {p.unidadMedida}
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
