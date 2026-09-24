import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart, Area
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  PieChart as PieChartIcon, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const getTodayAR = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
};

const Statistics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [businessData, setBusinessData] = useState(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [month, setMonth] = useState(getTodayAR().split('-')[1]);
  const [year, setYear] = useState(getTodayAR().split('-')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchHistoricalStats();
    fetchBusinessDaysStats();
  }, []);

  const fetchHistoricalStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }

      const url = params.toString() ? `/reports/historical?${params.toString()}` : '/reports/historical';
      const res = await api.get(url);
      setData(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar estadísticas históricas');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessDaysStats = async () => {
    setBusinessLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('year', year);
      params.set('month', month);

      const res = await api.get(`/reports/business-days?${params.toString()}`);
      setBusinessData(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar el detalle mensual');
    } finally {
      setBusinessLoading(false);
    }
  };

  const formatBusinessDate = (dateKey) => {
    const date = new Date(`${dateKey}T12:00:00-03:00`);
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    }).format(date);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-textLight">Estadísticas Históricas</h2>
          <p className="text-textMuted text-sm mt-1">Resumen total y acumulado de toda la operación</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center bg-surface p-3 rounded-xl border border-slate-800">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-background border border-slate-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
            max={endDate || undefined}
          />
          <span className="text-textMuted text-sm text-center">hasta</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-background border border-slate-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
            min={startDate || undefined}
          />
          <button 
            onClick={fetchHistoricalStats}
            className="bg-slate-800 hover:bg-slate-700 text-textLight px-4 py-2 rounded-xl border border-slate-700 transition-all flex items-center gap-2"
          >
            <Activity size={18} />
            Actualizar Datos
          </button>
        </div>
      </div>

      {(startDate && endDate) && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-textLight">
          Mostrando estadísticas entre <span className="font-semibold">{startDate}</span> y <span className="font-semibold">{endDate}</span>.
        </div>
      )}

      {/* Main Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={160} />
          </div>
          <p className="text-textMuted text-sm font-medium mb-1">Facturación Total</p>
          <p className="text-4xl font-black text-textLight mb-2">
            {formatCurrency(data.totales.facturacionHistorica)}
          </p>
          <div className="flex items-center text-emerald-400 text-sm font-bold bg-emerald-400/10 w-fit px-2 py-0.5 rounded-full">
            <ArrowUpRight size={16} className="mr-1" />
            Ventas Totales: {data.totales.ventasHistoricas}
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={160} />
          </div>
          <p className="text-textMuted text-sm font-medium mb-1">Ganancia Total</p>
          <p className="text-4xl font-black text-emerald-400 mb-2">
            {formatCurrency(data.totales.gananciaHistorica)}
          </p>
          <p className="text-textMuted text-sm">
            Margen histórico: {((data.totales.gananciaHistorica / data.totales.facturacionHistorica) * 100).toFixed(1)}%
          </p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Boxes size={160} />
          </div>
          <p className="text-textMuted text-sm font-medium mb-1">Stock Disponible</p>
          <p className="text-4xl font-black text-primary mb-2">
            {data.stock.totalItems} <span className="text-xl font-normal text-textMuted">uds.</span>
          </p>
          <div className="flex items-center text-amber-400 text-sm font-bold">
            {data.stock.productosBajoStock} productos con bajo stock
          </div>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-2xl border border-slate-800 shadow-lg space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-textLight">Detalle mensual por días hábiles</h3>
            <p className="text-sm text-textMuted mt-1">Mostrando solo de lunes a sábado para el mes seleccionado.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-textMuted mb-2">Mes</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-background border border-slate-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
              >
                <option value="01">Enero</option>
                <option value="02">Febrero</option>
                <option value="03">Marzo</option>
                <option value="04">Abril</option>
                <option value="05">Mayo</option>
                <option value="06">Junio</option>
                <option value="07">Julio</option>
                <option value="08">Agosto</option>
                <option value="09">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-textMuted mb-2">Año</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="bg-background border border-slate-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary w-28"
              />
            </div>
            <button
              onClick={fetchBusinessDaysStats}
              className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
            >
              <Activity size={18} />
              Ver mes
            </button>
          </div>
        </div>

        {businessLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : businessData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-background/50 p-4 rounded-xl border border-slate-800">
                <p className="text-textMuted text-xs mb-1">Facturación mensual</p>
                <p className="text-xl font-bold text-textLight">{formatCurrency(businessData.totales.montoTotal)}</p>
              </div>
              <div className="bg-background/50 p-4 rounded-xl border border-slate-800">
                <p className="text-textMuted text-xs mb-1">Ganancia neta</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(businessData.totales.gananciaNeta)}</p>
              </div>
              <div className="bg-background/50 p-4 rounded-xl border border-slate-800">
                <p className="text-textMuted text-xs mb-1">Tickets</p>
                <p className="text-xl font-bold text-textLight">{businessData.totales.totalVentas}</p>
              </div>
              <div className="bg-background/50 p-4 rounded-xl border border-slate-800">
                <p className="text-textMuted text-xs mb-1">Promedio por ticket</p>
                <p className="text-xl font-bold text-textLight">{formatCurrency(businessData.totales.ticketPromedio)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-background/40 rounded-xl border border-slate-800 p-4">
                <h4 className="text-lg font-semibold text-textLight mb-4">Ventas por día hábil</h4>
                <div className="h-80 w-full">
                  {businessData.timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={businessData.timeline.map((item) => ({
                        ...item,
                        displayDate: formatBusinessDate(item._id)
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="displayDate" stroke="#64748b" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar dataKey="montoTotal" name="Facturación" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="gananciaNeta" name="Ganancia" fill="#10b981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-textMuted">No hay ventas en días hábiles para este mes</div>
                  )}
                </div>
              </div>

              <div className="bg-background/40 rounded-xl border border-slate-800 p-4">
                <h4 className="text-lg font-semibold text-textLight mb-4">Métodos de pago</h4>
                <div className="space-y-3">
                  {businessData.ventasPorMetodoPago.length > 0 ? businessData.ventasPorMetodoPago.map((item) => (
                    <div key={item._id} className="flex items-center justify-between text-sm">
                      <span className="text-textLight capitalize">{item._id}</span>
                      <span className="text-textMuted">{formatCurrency(item.total)}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-textMuted">Sin datos para este mes.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-sm text-textLight">
                <thead className="bg-slate-900 text-xs text-textMuted uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-center">Tickets</th>
                    <th className="px-4 py-3 text-right">Facturación</th>
                    <th className="px-4 py-3 text-right">Costo</th>
                    <th className="px-4 py-3 text-right">Ganancia</th>
                    <th className="px-4 py-3 text-right">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-background/20">
                  {businessData.timeline.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-medium">{formatBusinessDate(item._id)}</td>
                      <td className="px-4 py-3 text-center">{item.totalVentas}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.montoTotal)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.costoTotal)}</td>
                      <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(item.gananciaNeta)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.ticketPromedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-textMuted">No se pudo cargar el detalle mensual.</div>
        )}
      </div>

      {/* Stock Valorization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-surface p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between">
           <div>
             <h3 className="text-lg font-bold text-textLight flex items-center gap-2 mb-6">
               <Briefcase size={20} className="text-primary" />
               Valor del Inventario
             </h3>
             <div className="space-y-4">
                <div>
                  <p className="text-textMuted text-xs uppercase tracking-wider mb-1">Inversión (Costo)</p>
                  <p className="text-xl font-bold text-textLight">{formatCurrency(data.stock.valorCompra)}</p>
                </div>
                <div>
                  <p className="text-textMuted text-xs uppercase tracking-wider mb-1">Venta Estimada</p>
                  <p className="text-xl font-bold text-textLight">{formatCurrency(data.stock.valorVenta)}</p>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-textMuted text-xs uppercase tracking-wider mb-1 text-emerald-400">Ganancia Proyectada</p>
                  <p className="text-2xl font-black text-emerald-400">{formatCurrency(data.stock.gananciaPotencial)}</p>
                </div>
             </div>
           </div>
           <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-xs text-textMuted leading-relaxed">
                Este valor representa el total de dinero invertido en mercadería actualmente en estantería.
              </p>
           </div>
        </div>

        {/* Evolución Histórica */}
        <div className="lg:col-span-3 bg-surface p-6 rounded-2xl border border-slate-800 shadow-lg">
           <h3 className="text-lg font-bold text-textLight mb-6 flex items-center gap-2">
             <Activity size={20} className="text-primary" />
             Evolución Histórica Mensual
           </h3>
           <div className="h-80 w-full">
              {data.evolucionMensual.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.evolucionMensual}>
                    <defs>
                      <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="_id" stroke="#64748b" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="monto" name="Facturación" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMonto)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-textMuted">Aún no hay suficientes datos históricos</div>
              )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Distribución por Categoría */}
         <div className="bg-surface p-6 rounded-2xl border border-slate-800 shadow-lg">
            <h3 className="text-lg font-bold text-textLight mb-6 flex items-center gap-2">
              <PieChartIcon size={20} className="text-primary" />
              Ventas por Categoría (Total)
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
               <div className="h-64 w-full md:w-1/2">
                 {data.distribucionCategorias.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.distribucionCategorias}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="monto"
                          nameKey="_id"
                        >
                          {data.distribucionCategorias.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                          formatter={(value) => formatCurrency(value)}
                        />
                      </PieChart>
                   </ResponsiveContainer>
                 ) : null}
               </div>
               <div className="w-full md:w-1/2 space-y-3">
                  {data.distribucionCategorias.slice(0, 6).map((cat, idx) => (
                    <div key={cat._id} className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                          <span className="text-textLight font-medium">{cat._id}</span>
                       </div>
                       <span className="text-textMuted text-xs font-bold">{formatCurrency(cat.monto)}</span>
                    </div>
                  ))}
                  {data.distribucionCategorias.length > 6 && (
                    <p className="text-center text-xs text-textMuted pt-2">...y {data.distribucionCategorias.length - 6} categorías más</p>
                  )}
               </div>
            </div>
         </div>

         {/* Resumen de Rendimiento de Stock */}
         <div className="bg-surface p-6 rounded-2xl border border-slate-800 shadow-lg">
            <h3 className="text-lg font-bold text-textLight mb-6 flex items-center gap-2">
              <Package size={20} className="text-primary" />
              Análisis de Stock
            </h3>
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/50 p-4 rounded-xl border border-slate-800">
                     <p className="text-textMuted text-xs mb-1">Rotación de Productos</p>
                     <p className="text-xl font-bold text-textLight">
                       {(data.totales.ventasHistoricas / 30).toFixed(1)} <span className="text-xs font-normal">v/día avg.</span>
                     </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-xl border border-slate-800">
                     <p className="text-textMuted text-xs mb-1">Valor Promedio de Compra</p>
                     <p className="text-xl font-bold text-textLight">
                       {formatCurrency(data.stock.valorCompra / (data.stock.totalItems || 1))}
                     </p>
                  </div>
               </div>

               <div className="relative pt-2">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-textLight">Eficiencia de Ganancia</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {((data.stock.gananciaPotencial / data.stock.valorVenta) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div 
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" 
                      style={{ width: `${(data.stock.gananciaPotencial / data.stock.valorVenta) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-textMuted mt-2 italic">
                    * El porcentaje de ganancia bruta proyectada sobre el total del inventario actual.
                  </p>
               </div>

               <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-start gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-textLight">Tip de Crecimiento</p>
                    <p className="text-xs text-textMuted leading-relaxed">
                      Tus categorías más fuertes representan el {(data.distribucionCategorias[0]?.monto / data.totales.facturacionHistorica * 100 || 0).toFixed(1)}% de tus ingresos históricos. Considera aumentar el stock de seguridad en estos rubros.
                    </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Statistics;
