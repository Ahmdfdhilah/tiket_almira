import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';

// Ubah definisi komponen untuk menggunakan parameter default
const PaymentStatusWidget = ({ tickets = [], loading = false }) => {
  // Helper function to safely access route data
  const getRouteData = (ticket) => {
    // Try different possible property names from backend
    return ticket.rute || ticket.Rute || ticket.route || {};
  };

  // Helper function to safely access user data  
  const getUserData = (ticket) => {
    return ticket.user || ticket.User || {};
  };

  // Group tickets by order_group_id and filter pending payments
  const pendingPayments = React.useMemo(() => {
    if (!tickets || !Array.isArray(tickets)) return [];

    // Group tickets by order
    const groupedOrders = [];
    const processedTickets = new Set();
    
    tickets.forEach(ticket => {
      if (processedTickets.has(ticket.id_tiket)) return;
      if (!ticket || typeof ticket !== 'object') return;
      
      if (ticket.order_group_id) {
        // Find all tickets in the same order group
        const orderTickets = tickets.filter(t => 
          t.order_group_id === ticket.order_group_id
        );
        
        // Mark all tickets in this group as processed
        orderTickets.forEach(t => processedTickets.add(t.id_tiket));
        
        // Create order object
        const masterTicket = orderTickets.find(t => t.is_master_ticket) || orderTickets[0];
        const allSeats = orderTickets.map(t => t.nomor_kursi).sort();
        const totalAmount = orderTickets.reduce((sum, t) => sum + parseFloat(t.total_bayar || 0), 0);
        
        groupedOrders.push({
          type: 'order',
          id_tiket: masterTicket.id_tiket,
          order_group_id: ticket.order_group_id,
          total_tickets: orderTickets.length,
          seats: allSeats,
          status_tiket: masterTicket.status_tiket,
          total_bayar: masterTicket.order_total_amount || totalAmount,
          tanggal_pemesanan: masterTicket.tanggal_pemesanan,
          batas_pembayaran: masterTicket.batas_pembayaran,
          rute: masterTicket.rute || masterTicket.Rute,
          user: masterTicket.user || masterTicket.User,
          tickets: orderTickets
        });
      } else {
        // Single ticket (legacy or single seat orders)
        processedTickets.add(ticket.id_tiket);
        groupedOrders.push({
          type: 'single',
          ...ticket,  
          seats: [ticket.nomor_kursi],
          total_tickets: 1
        });
      }
    });
    
    // Filter for pending payments and sort
    return groupedOrders
      .filter(order => order.status_tiket === 'pending')
      .sort((a, b) => {
        const dateA = a.batas_pembayaran ? new Date(a.batas_pembayaran) : new Date(0);
        const dateB = b.batas_pembayaran ? new Date(b.batas_pembayaran) : new Date(0);
        return dateB - dateA;
      });
  }, [tickets]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <h3 className="text-lg font-bold mb-4">Status Pembayaran</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <h3 className="text-lg font-bold mb-4">Status Pembayaran</h3>
      
      {pendingPayments.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-md text-center">
          <div className="text-4xl text-gray-300 mb-2">
            <i className="fas fa-check-circle"></i>
          </div>
          <p className="text-gray-600">Tidak ada pembayaran yang tertunda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPayments.map(order => {
            // Safely get route data
            const route = getRouteData(order);
            const user = getUserData(order);
            
            // Calculate time remaining with safety checks
            const now = new Date();
            const deadline = order.batas_pembayaran ? new Date(order.batas_pembayaran) : null;
            const hoursRemaining = deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60)) : 0;
            const isUrgent = hoursRemaining <= 4 && hoursRemaining > 0;
            const isExpired = hoursRemaining <= 0;
            
            // Format seats display
            const seatsDisplay = order.seats && order.seats.length > 0 
              ? order.seats.join(', ') 
              : 'N/A';
            
            return (
              <div 
                key={order.order_group_id || order.id_tiket} 
                className={`border rounded-md p-4 ${
                  isExpired ? 'border-gray-300 bg-gray-50' :
                  isUrgent ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold">
                      {route.asal || 'N/A'} - {route.tujuan || 'N/A'}
                    </h4>
                    <p className="text-sm">
                      {route.waktu_berangkat ? 
                        formatDate(route.waktu_berangkat) : 
                        'Tanggal tidak tersedia'
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.total_tickets > 1 ? (
                        <>
                          {order.total_tickets} Tiket - Kursi: {seatsDisplay}
                        </>
                      ) : (
                        `Kursi: ${seatsDisplay}`
                      )}
                    </p>
                    <div className="mt-2 font-semibold">
                      {formatCurrency(order.total_bayar || 0)}
                    </div>
                  </div>
                  
                  <div className={`text-sm px-3 py-1 rounded-full ${
                    isExpired ? 'bg-gray-100 text-gray-800' :
                    isUrgent ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {isExpired ? 'Expired' :
                     isUrgent ? `${hoursRemaining} jam tersisa!` : 
                     deadline ? `Batas: ${formatDate(deadline)}` : 'Pending'
                    }
                  </div>
                </div>
                
                <div className="mt-3 flex justify-end space-x-2">
                  {!isExpired && (
                    <Link
                      to={`/ticket/${order.id_tiket}`}
                      className={`px-4 py-2 rounded-lg text-white font-medium text-sm ${
                        isUrgent ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'
                      }`}
                    >
                      Bayar Sekarang
                    </Link>
                  )}
                  
                  <Link
                    to={`/ticket/${order.id_tiket}`}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-300"
                  >
                    Detail
                  </Link>
                </div>
              </div>
            );
          })}
          
          {/* Show link to view all tickets if there are more than 3 */}
          {pendingPayments.length > 3 && (
            <div className="text-center pt-4 border-t">
              <Link 
                to="/my-tickets?filter=pending" 
                className="text-pink-600 hover:text-pink-800 text-sm font-medium"
              >
                Lihat {pendingPayments.length - 3} pembayaran lainnya →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

PaymentStatusWidget.propTypes = {
  tickets: PropTypes.array,
  loading: PropTypes.bool
};

export default PaymentStatusWidget;