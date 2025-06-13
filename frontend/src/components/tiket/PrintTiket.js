import React, { useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Spinner from '../layout/Spinner';
import { getGroupedTicketById } from '../../redux/actions/tiketActions';
import { formatDate, formatTime } from '../../utils/formatters';

const PrintTiket = ({ getGroupedTicketById, ticket, loading, error }) => {
  const { id } = useParams();
  const componentRef = useRef();
  
  useEffect(() => {
    if (id) {
      getGroupedTicketById(id);
    }
  }, [getGroupedTicketById, id]);

  // Helper functions to safely access nested data
  const getRouteData = (ticketData) => {
    // Handle grouped order structure
    if (ticketData?.route) {
      return ticketData.route;
    }
    // Fallback to individual ticket structure
    return ticketData?.rute || ticketData?.Rute || {};
  };

  const getUserData = (ticketData) => {
    return ticketData?.user || ticketData?.User || {};
  };

  const getBusData = (ticketData) => {
    const route = getRouteData(ticketData);
    return route?.bus || route?.Bus || { nama_bus: route?.nama_bus || 'Bus Tidak Diketahui' };
  };

  // Helper function to get order/ticket data
  const getOrderData = (ticketData) => {
    return ticketData?.order || null;
  };

  // Helper function to get tickets array for grouped orders
  const getTicketsData = (ticketData) => {
    return ticketData?.tickets || [];
  };
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Tiket_${id}`,
    onAfterPrint: () => console.log('Dokumen berhasil dicetak')
  });
  
  useEffect(() => {
    // Auto print when component loads and ticket data is available
    if (ticket && !loading) {
      // Small delay to ensure component is fully rendered
      console.log(ticket);
      
      const timer = setTimeout(() => {
        handlePrint();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [ticket, loading, handlePrint]);
  
  if (loading || !ticket) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Spinner />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  // Extract data safely
  const orderData = getOrderData(ticket);
  const ticketsData = getTicketsData(ticket);
  const routeData = getRouteData(ticket);
  const userData = getUserData(ticket);
  const busData = getBusData(ticket);
  
  // For grouped orders, use the first ticket's data, for individual tickets use ticket data
  const mainTicket = ticketsData.length > 0 ? ticketsData[0] : ticket;

  // Check if we have minimum required data
  if (!routeData.asal || !routeData.tujuan || !userData.username) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg">
          Data tiket tidak lengkap. Tidak dapat mencetak tiket.
        </div>
      </div>
    );
  }
  
  // Generate QR code data
  const qrData = JSON.stringify({
    id: orderData?.order_group_id || mainTicket?.id_tiket || ticket?.id_tiket || 'N/A',
    name: userData.username || 'N/A',
    route: `${routeData.asal || 'N/A'}-${routeData.tujuan || 'N/A'}`,
    date: routeData.waktu_berangkat || new Date(),
    seat: orderData?.seats || mainTicket?.nomor_kursi || ticket?.nomor_kursi || 'N/A',
    tickets: orderData?.total_tickets || 1
  });
  
  // Format date for barcode
  const barcodeDate = routeData.waktu_berangkat 
    ? new Date(routeData.waktu_berangkat).toISOString().split('T')[0].replace(/-/g, '')
    : new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  // Create barcode data
  const barcodeData = `TB${mainTicket?.id_tiket || ticket?.id_tiket || '000'}${barcodeDate}`;
  
  return (
    <div className="relative">
      <div className="fixed top-4 right-4 print:hidden">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <i className="fas fa-print mr-2"></i>
          Cetak
        </button>
      </div>
      
      <div ref={componentRef} className="px-8max-w-2xl mx-auto bg-white p-8 my-8 print:my-0 print:p-0">
        {/* Ticket Header */}
        <div className="border-b-2 border-gray-200 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">TIKET BUS</h1>
            <p className="text-gray-600">Almira Travel - Perjalanan Nyaman Anda</p>
          </div>
          <div className="text-right">
            <img 
              src="/assets/img/logo.png" 
              alt="Logo" 
              className="h-12"
            />
          </div>
        </div>
        
        {/* Ticket Body */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-bold mb-4">Informasi Perjalanan</h2>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-gray-600">Nama Bus</td>
                  <td className="py-2 font-semibold">{busData.nama_bus}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Rute</td>
                  <td className="py-2 font-semibold">{routeData.asal} - {routeData.tujuan}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Tanggal</td>
                  <td className="py-2 font-semibold">
                    {routeData.waktu_berangkat ? formatDate(routeData.waktu_berangkat) : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Waktu Berangkat</td>
                  <td className="py-2 font-semibold">
                    {routeData.waktu_berangkat ? formatTime(routeData.waktu_berangkat) : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Nomor Kursi</td>
                  <td className="py-2 font-semibold">
                    {orderData ? (
                      Array.isArray(orderData.seats) ? orderData.seats.join(', ') : (orderData.seats || 'N/A')
                    ) : (
                      Array.isArray(mainTicket?.nomor_kursi || ticket?.nomor_kursi) ? 
                        (mainTicket?.nomor_kursi || ticket?.nomor_kursi).join(', ') : 
                        (mainTicket?.nomor_kursi || ticket?.nomor_kursi || 'N/A')
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div>
            <h2 className="text-lg font-bold mb-4">Informasi Penumpang</h2>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-gray-600">Nama</td>
                  <td className="py-2 font-semibold">{userData.username || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">Email</td>
                  <td className="py-2 font-semibold">{userData.email || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">No. Telepon</td>
                  <td className="py-2 font-semibold">{userData.no_telepon || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600">{orderData ? 'No. Pesanan' : 'No. Tiket'}</td>
                  <td className="py-2 font-semibold">
                    {orderData ? orderData.order_group_id : `TB-${mainTicket?.id_tiket || ticket?.id_tiket || '000'}`}
                  </td>
                </tr>
                {orderData && (
                  <tr>
                    <td className="py-2 text-gray-600">Jumlah Tiket</td>
                    <td className="py-2 font-semibold">{orderData.total_tickets} tiket</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2 text-gray-600">Status</td>
                  <td className={`py-2 font-semibold ${
                    mainTicket?.status_tiket === 'confirmed' ? 'text-green-600' : 
                    mainTicket?.status_tiket === 'pending' ? 'text-yellow-600' : 
                    'text-gray-600'
                  }`}>
                    {mainTicket?.status_tiket === 'confirmed' ? 'Dikonfirmasi' : 
                     mainTicket?.status_tiket === 'pending' ? 'Menunggu Pembayaran' : 
                     mainTicket?.status_tiket || ticket?.status_tiket || 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Barcode and QR Code */}
        {/* <div className="flex justify-between items-center border-t-2 border-b-2 border-gray-200 py-4 my-6"> */}
          {/* <div className="text-center">
            <div className="mb-2">
              <img 
                src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${barcodeData}&scale=3&includetext&textxalign=center`}
                alt="Barcode" 
                className="h-16 mx-auto"
              />
            </div>
            <p className="text-xs text-gray-500">{barcodeData}</p>
          </div> */}
          
          {/* <div className="text-center">
            <div className="mb-2">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=120x120`}
                alt="QR Code" 
                className="h-24 w-24 mx-auto"
              />
            </div>
            <p className="text-xs text-gray-500">Scan untuk verifikasi</p>
          </div> */}
        {/* </div> */}
        
        {/* Ticket Footer */}
        <div className="text-center text-gray-600 text-sm mb-4">
          <p className="mb-2 font-semibold">Penting:</p>
          <ul className="list-disc text-left pl-8 space-y-1">
            <li>Harap tiba di terminal minimal 30 menit sebelum keberangkatan.</li>
            <li>Tiket ini harus ditunjukkan kepada petugas sebelum naik bus.</li>
            <li>Pembatalan tiket harus dilakukan minimal 24 jam sebelum keberangkatan.</li>
            <li>Bagasi yang diperbolehkan maksimal 20kg per penumpang.</li>
            <li>Untuk informasi lebih lanjut, hubungi customer service Almira di 0812-2549-6270.</li>
          </ul>
        </div>
        
        <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
          <p>Tiket ini diterbitkan oleh Almira © {new Date().getFullYear()}</p>
          <p>www.Almira.com</p>
        </div>
      </div>
    </div>
  );
};

PrintTiket.propTypes = {
  getGroupedTicketById: PropTypes.func.isRequired,
  ticket: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string
};

const mapStateToProps = state => ({
  ticket: state.tiket.selectedTicket,
  loading: state.tiket.loading,
  error: state.tiket.error
});

export default connect(mapStateToProps, { getGroupedTicketById })(PrintTiket);